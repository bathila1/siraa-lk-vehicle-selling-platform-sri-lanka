'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Phone, Car, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

import { Button } from '@/components/ui/Button';
import { parseSearchQuery } from '@/lib/validations/vehicle-request';

interface VehicleType {
  id: number;
  name_en: string;
  name_si?: string | null;
}

interface District {
  id: number;
  name_en: string;
}

interface Props {
  vehicleTypes: VehicleType[];
  districts: District[];
  prefillQuery?: string;
}

const FUEL_OPTIONS = ['petrol', 'diesel', 'hybrid', 'electric', 'lpg', 'cng'] as const;
const TRANSMISSION_OPTIONS = ['auto', 'manual', 'tiptronic', 'cvt'] as const;
const CONDITION_OPTIONS = ['brand_new', 'unregistered', 'registered', 'reconditioned'] as const;

const CURRENT_YEAR = new Date().getFullYear();

export function VehicleRequestForm({ vehicleTypes, districts, prefillQuery }: Props) {
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  // Form state
  const [contactPhone, setContactPhone] = useState('');

  const [vehicleTypeId, setVehicleTypeId] = useState<number | ''>('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [yearMin, setYearMin] = useState<number | ''>('');
  const [yearMax, setYearMax] = useState<number | ''>('');
  const [budgetMin, setBudgetMin] = useState<number | ''>('');
  const [budgetMax, setBudgetMax] = useState<number | ''>('');
  const [fuelType, setFuelType] = useState<string>('');
  const [transmission, setTransmission] = useState<string>('');
  const [condition, setCondition] = useState<string>('');

  const [districtId, setDistrictId] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  // UI state
  const [showMore, setShowMore] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

  // Auto-fill from search query
  useEffect(() => {
    if (!prefillQuery) return;
    const parsed = parseSearchQuery(prefillQuery);

    if (parsed.make) setMake(parsed.make);
    if (parsed.model) setModel(parsed.model);
    if (parsed.yearMin) setYearMin(parsed.yearMin);
    if (parsed.yearMax) setYearMax(parsed.yearMax);
    if (parsed.budgetMax) setBudgetMax(parsed.budgetMax);
    if (parsed.fuelType) setFuelType(parsed.fuelType);
    if (parsed.transmission) setTransmission(parsed.transmission);
    if (parsed.description) setDescription(parsed.description);

    if (parsed.fuelType || parsed.transmission || parsed.description) {
      setShowMore(true);
    }
  }, [prefillQuery]);

  const submit = async () => {
    setError(null);

    if (!contactPhone.trim() || !vehicleTypeId) {
      setError('Phone number and vehicle type are required.');
      return;
    }
    if (!captchaToken) {
      setError('Please complete the verification.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactPhone,
          // Defaults removed: no name, default WhatsApp preferred
          whatsappPref: true,
          vehicleTypeId: Number(vehicleTypeId),
          make: make.trim() || undefined,
          model: model.trim() || undefined,
          yearMin: yearMin ? Number(yearMin) : undefined,
          yearMax: yearMax ? Number(yearMax) : undefined,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          fuelType: fuelType || undefined,
          transmission: transmission || undefined,
          condition: condition || undefined,
          districtId: districtId ? Number(districtId) : undefined,
          description: description.trim() || undefined,
          source: prefillQuery ? 'failed_search' : 'direct',
          sourceQuery: prefillQuery || undefined,
          captchaToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Submission failed.');
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      setDone(true);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (done) {
    return (
      <div className="rounded-2xl border-2 border-[var(--brand-green)] bg-gradient-to-br from-[var(--brand-bg)] to-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-green)] text-white">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-[var(--brand-deep)]">Request received! 🎉</h2>
        <p className="mb-6 text-sm text-gray-600">
          We&apos;ll contact you at <strong>{contactPhone}</strong> within 24 hours.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/search"
            className="rounded-lg border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-[var(--brand-green)]"
          >
            Continue
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-[var(--brand-green)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-deep)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-5"
    >
      {prefillQuery && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <span>
              We prefilled some <strong>&quot;{prefillQuery}&quot;</strong>.
            </span>
          </p>
        </div>
      )}

      {/* Mobile Number */}
      <Section>
        <Field label="Mobile number" required hint="We'll contact you">
          <PhoneInput value={contactPhone} onChange={setContactPhone} />
        </Field>
      </Section>

      {/* Vehicle */}
      <Section>
        <Field label="" required>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {vehicleTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setVehicleTypeId(t.id)}
                className={`rounded-lg border px-3 py-2.5 text-sm transition-all ${
                  vehicleTypeId === t.id
                    ? 'border-[var(--brand-green)] bg-[var(--brand-bg)] font-medium text-[var(--brand-deep)] shadow-sm'
                    : 'border-[var(--color-border)] bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.name_en}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Make">
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              maxLength={50}
              placeholder="e.g. Toyota"
              className="input"
            />
          </Field>
          <Field label="Model">
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              maxLength={100}
              placeholder="e.g. Aqua"
              className="input"
            />
          </Field>
        </div>
      </Section>

      {/* More preferences (collapsed) */}
      <details
        open={showMore}
        onToggle={(e) => setShowMore((e.target as HTMLDetailsElement).open)}
        className="group rounded-2xl border border-[var(--color-border)] bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
      >
        <summary className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-medium text-gray-700">More preferences (optional)</span>
          <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
        </summary>

        <div className="mt-4 space-y-4">
          <Field label="Budget range (LKR)">
            <div className="grid grid-cols-2 gap-2">
              <NumberInput value={budgetMin} onChange={setBudgetMin} placeholder="Min" />
              <NumberInput value={budgetMax} onChange={setBudgetMax} placeholder="Max" />
            </div>
            {(budgetMin || budgetMax) && (
              <p className="mt-1.5 text-xs text-gray-500">
                {budgetMin ? formatBudget(Number(budgetMin)) : 'Any'} —{' '}
                {budgetMax ? formatBudget(Number(budgetMax)) : 'Any'}
              </p>
            )}
          </Field>

          <Field label="Year range">
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                value={yearMin}
                onChange={setYearMin}
                placeholder="From"
                min={1990}
                max={CURRENT_YEAR}
              />
              <NumberInput
                value={yearMax}
                onChange={setYearMax}
                placeholder="To"
                min={1990}
                max={CURRENT_YEAR}
              />
            </div>
          </Field>

          <Field label="Fuel type">
            <ChipGroup
              options={FUEL_OPTIONS.map((f) => ({ value: f, label: capitalize(f) }))}
              selected={fuelType}
              onChange={setFuelType}
            />
          </Field>

          <Field label="Transmission">
            <ChipGroup
              options={TRANSMISSION_OPTIONS.map((t) => ({ value: t, label: capitalize(t) }))}
              selected={transmission}
              onChange={setTransmission}
            />
          </Field>

          <Field label="Condition">
            <ChipGroup
              options={CONDITION_OPTIONS.map((c) => ({
                value: c,
                label: c.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              }))}
              selected={condition}
              onChange={setCondition}
            />
          </Field>

          <Field label="District">
            <select
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : '')}
              className="input"
            >
              <option value="">Any district</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_en}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Anything else?">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Specific features, urgency, etc."
              className="input resize-none"
            />
          </Field>
        </div>
      </details>

      {siteKey && (
        <div className="flex justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            options={{ size: 'flexible', appearance: 'interaction-only' }}
            onSuccess={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
          />
        </div>
      )}

      {!captchaToken && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Verifying you&apos;re human...
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={submitting}
        disabled={!contactPhone || !vehicleTypeId || !captchaToken}
      >
        Submit Request
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Style />
    </form>
  );
}

// ============================================================================
// Helper components
// ============================================================================

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-5">
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="07x xxx xxxx"
        className="input pl-10"
        required
      />
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  value: number | '';
  onChange: (v: number | '') => void;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      placeholder={placeholder}
      min={min}
      max={max}
      className="input"
    />
  );
}

function ChipGroup({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(selected === opt.value ? '' : opt.value)}
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
            selected === opt.value
              ? 'border-[var(--brand-green)] bg-[var(--brand-green)] text-white'
              : 'border-[var(--color-border)] bg-white text-gray-700 hover:border-[var(--brand-green)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatBudget(amount: number): string {
  if (amount >= 10_000_000) return `Rs. ${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `Rs. ${(amount / 100_000).toFixed(2)} Lakhs`;
  return `Rs. ${amount.toLocaleString('en-LK')}`;
}

function Style() {
  return (
    <style jsx global>{`
      .input {
        width: 100%;
        padding: 0.625rem 0.875rem;
        font-size: 0.875rem;
        border: 1px solid var(--color-border);
        border-radius: 0.5rem;
        outline: none;
        background: white;
        transition: border-color 0.15s;
      }
      .input:focus {
        border-color: var(--brand-green);
        box-shadow: 0 0 0 3px rgba(47, 160, 132, 0.1);
      }
    `}</style>
  );
}
