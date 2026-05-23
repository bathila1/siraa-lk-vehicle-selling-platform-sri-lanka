import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF protection via Origin header verification.
 *
 * Theory:
 *   The browser ALWAYS sends an `Origin` header on cross-origin POST/PATCH/DELETE
 *   requests. The attacker cannot forge this header from JavaScript — only the
 *   browser itself can set it. So if the Origin matches our own domain, we know
 *   the request came from our own pages (not a malicious site embedding our API).
 *
 * Same-origin reads/writes from our pages: Origin is set, matches — pass.
 * Cross-origin attack from evil.com: Origin is "https://evil.com" — fail.
 * Direct curl/Postman: no Origin or different Origin — fail (acceptable).
 *
 * What this doesn't protect against:
 *   - Server-to-server attacks (use API keys / IPN signatures for those)
 *   - XSS (CSP + escaping handle this)
 *   - Attacks where the attacker controls the user's network (use HTTPS)
 */

/** Domains allowed to make state-changing requests to our API. */
function getAllowedOrigins(): string[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';
  const origins = [siteUrl, siteUrl.replace('https://', 'http://')];

  // In dev, also allow localhost variants
  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://localhost:3000',
    );
  }

  return origins;
}

/**
 * Check that the request's Origin header matches our site.
 * Returns null if OK, or a NextResponse with 403 if blocked.
 */
export function verifyOrigin(request: NextRequest): NextResponse | null {
  // Read-only methods don't change state — no CSRF risk
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const allowed = getAllowedOrigins();

  // Origin is the primary check
  if (origin) {
    const matches = allowed.some((a) => origin === a || origin.startsWith(a));
    if (matches) return null;
    return NextResponse.json(
      { error: 'Cross-origin request blocked.' },
      { status: 403 },
    );
  }

  // No Origin? Fall back to Referer (older browsers, some clients)
  if (referer) {
    const matches = allowed.some((a) => referer.startsWith(a));
    if (matches) return null;
    return NextResponse.json(
      { error: 'Cross-origin request blocked.' },
      { status: 403 },
    );
  }

  // No Origin AND no Referer — could be curl, Postman, or a stripped fetch.
  // For state-changing operations, be cautious and block.
  // Exception: PayHere IPN webhooks come without an Origin — those have a separate
  // signature check, but the IPN route should explicitly skip this CSRF check.
  return NextResponse.json(
    { error: 'Missing origin information.' },
    { status: 403 },
  );
}
