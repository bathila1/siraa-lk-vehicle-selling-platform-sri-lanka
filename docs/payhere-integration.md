# PayHere Sandbox Integration Plan

> Phase 4 — Monetization. This document is the contract before code is written.

## Why PayHere

PayHere is Sri Lanka's most-used local payment gateway. It accepts Visa, MasterCard, AMEX, eZ Cash, and local bank cards. Onboarding for a sole proprietorship is straightforward and supports sandbox before going live.

The integration we use is the **Checkout API** (server-generated hash + form POST + IPN webhook). We are deliberately **not** using the JavaScript SDK popup variant — server-side hash generation is mandatory anyway, and a full redirect is simpler to debug and gives PayHere full control of the card-entry UI (PCI-DSS comfort).

---

## Account setup (one-time, before code)

1. Sign up at https://sandbox.payhere.lk (sandbox merchant account — free, separate from live).
2. After login → **Settings → Domains & Credentials**.
3. Note the **Merchant ID** (numeric, same for sandbox + live).
4. Click **Add Domain/App**:
   - Brand name: auto-set from your account.
   - Type: **Domain**.
   - For local development: `127.0.0.1:3000` and your Vercel preview URL.
   - For production: `siraa.lk` and `www.siraa.lk`.
5. Wait for the domain to be approved.
6. Copy the **Merchant Secret** for each domain. *Different secret per domain.* This goes in `PAYHERE_MERCHANT_SECRET`.
7. Repeat the domain approval flow on the live PayHere account before launch.

> **⚠️ Critical:** the Merchant Secret is domain-specific. If you switch from `localhost` to `siraa.lk`, you need a new secret. Production secret must never appear in the sandbox `.env` file or vice versa.

---

## The four moving parts

```
┌────────────┐  1. Initiate    ┌────────────┐  2. Redirect    ┌──────────┐
│   Seller   │ ──────────────→ │  Siraa.lk  │ ──────────────→ │ PayHere  │
│  Browser   │                 │   Server   │                 │ Checkout │
└────────────┘                 └────────────┘                 └──────────┘
                                      ▲                            │
                                      │     4. IPN webhook         │ 3. Payment
                                      │  (server-to-server)        │ on PayHere
                                      └────────────────────────────┘
                                                                   │
                                                                   ▼
                                                          ┌──────────────┐
                                                          │ /payment/    │
                                                          │   return     │ ← 5. User redirected back
                                                          └──────────────┘
```

1. Seller clicks "Buy Boost" → our `/api/payment/initiate` endpoint creates a `payments` row (status `pending`) and a `boosts` row (status `pending`), then generates the PayHere hash.
2. We render a hidden HTML form pre-filled with all PayHere params + hash, and auto-submit it. The seller is redirected to PayHere.
3. The seller enters card details on PayHere's hosted page. PayHere processes it.
4. PayHere POSTs to our **`/api/payment/notify`** webhook (server-to-server, the source of truth). We verify the signature, then update the `payments` row to `completed` and activate the `boosts` row.
5. PayHere redirects the seller's browser to our `return_url` (`/payment/return?order_id=...`). This page is **cosmetic only** — it tells the user "thanks, your boost is active". It does NOT trust this redirect to confirm payment; it polls our DB for the IPN-confirmed status.

> **⚠️ Critical:** the user-facing return is unreliable (they can close the tab, browser can fail to redirect). Always treat the IPN webhook as the only authoritative payment confirmation.

---

## Step 1 — Initiate payment

**Route:** `POST /api/payment/initiate`

**Input** (validated with Zod `boostInitiateSchema`):
```ts
{ vehicleId: number; planId: number }
```

**Server logic:**
1. Verify the seller is logged in via cookie (`current_seller_id()` exists).
2. Verify the vehicle belongs to this seller and is `active`.
3. Verify the boost plan exists and is `active`.
4. Generate an `order_id`: `siraa-{nanoid(10)}` (10-char nanoid, URL-safe, ~84 bits entropy).
5. Insert a `payments` row: status `pending`, amount = plan price, gateway_order_id = our generated order_id.
6. Insert a `boosts` row: status `pending`, vehicle_id, plan_id, amount_paid, payment_id, starts_at/expires_at calculated but not yet activated.
7. Compute the hash:
   ```ts
   const amountStr = amount.toFixed(2); // "500.00", critical: 2 decimal places
   const hashedSecret = md5(merchantSecret).toUpperCase();
   const hash = md5(
     `${merchantId}${orderId}${amountStr}${currency}${hashedSecret}`
   ).toUpperCase();
   ```
8. Return JSON with all PayHere form params + the hash + the checkout URL.

**Client:**
- Receive the JSON.
- Programmatically create a hidden `<form>` with all the fields.
- Auto-submit it. The browser redirects to PayHere.

### PayHere form parameters

| Field | Source | Notes |
|---|---|---|
| `merchant_id` | env | `PAYHERE_MERCHANT_ID` |
| `return_url` | computed | `{SITE_URL}/payment/return?order_id={orderId}` |
| `cancel_url` | computed | `{SITE_URL}/payment/cancel?order_id={orderId}` |
| `notify_url` | computed | `{SITE_URL}/api/payment/notify` (must be HTTPS, publicly reachable) |
| `order_id` | generated | `siraa-{nanoid(10)}` |
| `items` | computed | e.g., `BoostPro for vehicle #1234` (under 100 chars) |
| `currency` | constant | `LKR` |
| `amount` | plan | Numeric, always 2 decimals: `"500.00"` |
| `first_name` | seller | From `sellers.full_name` (first token) |
| `last_name` | seller | From `sellers.full_name` (remaining tokens) or fallback `"-"` |
| `email` | seller | We don't store seller emails — use `noreply+{sellerId}@siraa.lk` as placeholder |
| `phone` | seller | `sellers.phone` in `0771234567` format |
| `address` | seller | District + city name fallback |
| `city` | seller | From `cities.name_en` |
| `country` | constant | `Sri Lanka` |
| `hash` | computed | See formula above |

> **Hash trap:** `amount` in the hash must match the `amount` in the form **byte-for-byte**, including the two decimal places. `500` ≠ `500.00`. Use `Number(amount).toFixed(2)`.

---

## Step 2 — IPN webhook (THE source of truth)

**Route:** `POST /api/payment/notify`

**No auth required** — this is called by PayHere directly. Security comes from the `md5sig` signature check, not from authentication.

**Input** (PayHere POSTs form-encoded body):
```
merchant_id, order_id, payment_id, payhere_amount, payhere_currency,
status_code, md5sig, custom_1, custom_2, method, status_message, ...
```

**Server logic:**

1. **Read raw form body** (Next.js Route Handler):
   ```ts
   const body = await request.formData();
   const merchant_id      = body.get('merchant_id')      as string;
   const order_id         = body.get('order_id')         as string;
   const payhere_amount   = body.get('payhere_amount')   as string; // string, not float
   const payhere_currency = body.get('payhere_currency') as string;
   const status_code      = body.get('status_code')      as string;
   const md5sig           = body.get('md5sig')           as string;
   const payment_id       = body.get('payment_id')       as string | null;
   ```

2. **Verify signature:**
   ```ts
   const hashedSecret = md5(merchantSecret).toUpperCase();
   const local = md5(
     `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`
   ).toUpperCase();
   if (local !== md5sig) return new Response('Invalid signature', { status: 400 });
   ```

3. **Look up our `payments` row by `order_id`:**
   ```sql
   select * from payments where gateway_order_id = $1
   ```
   If not found → return 404 (someone forged or PayHere bug).

4. **Idempotency check** — PayHere can call the IPN multiple times for the same order:
   ```ts
   if (payment.status === 'completed') return new Response('OK', { status: 200 });
   ```

5. **Verify amount matches** (defense in depth — should already be guaranteed by signature, but double-check):
   ```ts
   if (Math.abs(parseFloat(payhere_amount) - payment.amount) > 0.01) {
     log.error({ event: 'payment.amount_mismatch', orderId, expected: payment.amount, got: payhere_amount });
     return new Response('Amount mismatch', { status: 400 });
   }
   ```

6. **Map PayHere status_code:**

   | `status_code` | Meaning | Action |
   |---|---|---|
   | `2`  | Success | Mark payment `completed`, activate boost, record `payment_id` |
   | `0`  | Pending | Leave as `pending`, IPN will be called again |
   | `-1` | Cancelled | Mark payment `cancelled`, cancel boost |
   | `-2` | Failed | Mark payment `failed`, cancel boost |
   | `-3` | Chargedback | Mark payment `refunded`, cancel boost retroactively, log for review |

7. **On status 2 (success):** in a single transaction:
   ```sql
   begin;
     update payments set
       status = 'completed',
       gateway_payment_id = $payment_id,
       ipn_received_at = now(),
       completed_at = now(),
       raw_response = $raw_body
     where id = $payment_id;

     update boosts set
       status = 'active',
       starts_at = now(),
       expires_at = now() + ($duration_days || ' days')::interval
     where payment_id = $payment_id;
   commit;
   ```

8. **Always respond `200 OK`** to PayHere once processed (success or graceful failure). A non-2xx response causes PayHere to retry — which is desirable on transient errors but should not happen on permanent failures.

> **⚠️ Critical:** the IPN must use the **service-role Supabase client** (bypasses RLS) because there's no seller session attached to a webhook call.

---

## Step 3 — Return / Cancel pages

These are user-facing and **cosmetic**. They never trust their own URL params for payment confirmation — they poll the database (which has been updated by IPN).

**`/payment/return?order_id=siraa-abc123`** (server component):
1. Look up the `payments` row.
2. If `completed` → show "🎉 Boost active!"
3. If still `pending` → show "We're confirming your payment..." with auto-refresh every 5s for up to 60s. If still pending after 60s, suggest contacting support.
4. If `failed`/`cancelled` → show "Payment didn't go through. Try again?"

**`/payment/cancel?order_id=siraa-abc123`**:
- Mark the local `payments` row `cancelled` if still `pending` (and the boost too).
- Show "No worries — your card wasn't charged."

---

## Step 4 — Failure modes & how we handle them

| Scenario | Handling |
|---|---|
| User closes the PayHere tab mid-payment | `payments` stays `pending`. After 30 minutes a cron job marks it `failed`. |
| IPN never arrives (PayHere outage) | Same — pending → expired after 30 min. Admin can manually mark it `completed` if confirmed via PayHere dashboard. |
| Signature mismatch on IPN | Reject with 400. Log for investigation. Never trust an IPN we can't verify. |
| Same IPN delivered twice | Idempotency check on `status === 'completed'`. Safe. |
| User reloads `/payment/return` 100 times | Cheap read-only DB hit; no side effects. |
| Test card declined (sandbox) | PayHere sends IPN with `status_code = -2`. We mark `failed`. |
| Network blip while computing hash | `/api/payment/initiate` fails atomically — `payments` row is rolled back. |
| Replay attack — attacker POSTs old IPN body | Signature still valid, but our idempotency check + amount check + status check prevent duplicate boost activation. |

---

## Step 5 — Sandbox testing

**Test cards** (sandbox only, never charged):
- Visa: `4916217501611292`
- MasterCard: `5307732125531191`
- AMEX: `346781005510225`
- CVV: any 3 digits
- Expiry: any future date
- Name: anything

**For local IPN testing** PayHere needs a public URL. Two options:
- **ngrok** (recommended for dev): `ngrok http 3000` → use the HTTPS URL as `notify_url`.
- **Vercel preview deployments**: each PR gets a public URL; use it for testing.

**Test checklist** (run before going live):
- [ ] Successful payment → boost activates, payment row shows `completed`, expiry date is correct
- [ ] User cancels on PayHere → boost stays `pending`, cleaned up by cron
- [ ] Closing tab mid-payment → IPN never arrives → 30-min cleanup works
- [ ] Same boost paid twice (double-click race) → only one boost activated
- [ ] Signature tampering → IPN rejected with 400
- [ ] Amount tampering → IPN rejected
- [ ] Re-delivered IPN → no double activation
- [ ] Failed test card → boost marked `failed`, seller can retry
- [ ] `/payment/return` works on success and on still-pending
- [ ] Boost expires exactly at the right day boundary

---

## Step 6 — Going live

When ready for production:
1. Sign up at https://www.payhere.lk for a live merchant account (KYC required — NIC/business reg).
2. Add `siraa.lk` and `www.siraa.lk` as domains; wait for approval.
3. Copy the **live Merchant Secret** into Vercel env vars (not in `.env.local`).
4. Set `PAYHERE_MODE=live` and `NEXT_PUBLIC_PAYHERE_CHECKOUT_URL=https://www.payhere.lk/pay/checkout`.
5. Do one real-money smoke test (Rs. 500 boost) before announcing launch.

---

## File layout (Phase 4 implementation)

```
lib/payhere/
├── hash.ts           Hash generation + IPN signature verification
├── types.ts          PayHere param types
└── client.ts         Build form params, status code mapper

app/api/payment/
├── initiate/route.ts POST: create payment + boost rows, return form params
├── notify/route.ts   POST: IPN webhook (service-role DB writes)
└── cancel/route.ts   POST: mark as cancelled from /payment/cancel page

app/payment/
├── return/page.tsx   Cosmetic success page (polls DB)
└── cancel/page.tsx   Cosmetic cancel page
```

## Required env vars (already in `.env.example`)

```
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
PAYHERE_MODE=sandbox   # or "live"
NEXT_PUBLIC_PAYHERE_CHECKOUT_URL=https://sandbox.payhere.lk/pay/checkout
```

---

## Security checklist

- [x] Merchant secret never sent to the client (hash generated server-side only)
- [x] IPN signature verified on every notification
- [x] Idempotency on duplicate IPN delivery
- [x] Amount verification (defense in depth)
- [x] Status code mapped explicitly — no implicit success
- [x] Service role used only inside the IPN handler (never elsewhere on client-touchable routes)
- [x] All payment writes go through transactions
- [x] Raw IPN body stored in `payments.raw_response` for audit forensics
- [x] No payment confirmation logic in the user-facing return page
