'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';

import { StepDetails } from './StepDetails';
import { StepImages } from './StepImages';
import { StepLocation } from './StepLocation';
import { StepReview } from './StepReview';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const DRAFT_KEY = 'siraa_post_ad_draft';

export interface PostAdDraft {
  vehicleTypeId: number | null;
  makeId: number | null;
  model: string;
  year: number | null;
  price: number | null;
  mileageKm: number | null;
  engineCc: number | null;
  bodyType: string | null;
  transmission: string | null;
  fuelType: string | null;
  condition: 'registered';
  color: string;
  previousOwners: number | null;
  description: string;
  districtId: number | null;
  cityId: number | null;
  lat: number | null;
  lng: number | null;
  customAttributes: Record<string, unknown>;
  imageUrls: string[];
}

const emptyDraft: PostAdDraft = {
  vehicleTypeId: null,
  makeId: null,
  model: '',
  year: null,
  price: null,
  mileageKm: null,
  engineCc: null,
  bodyType: null,
  transmission: null,
  fuelType: null,
  condition: 'registered',
  color: '',
  previousOwners: null,
  description: '',
  districtId: null,
  cityId: null,
  lat: null,
  lng: null,
  customAttributes: {},
  imageUrls: [],
};

interface Props {
  vehicleTypes: { id: number; name_en: string }[];
  districts: { id: number; name_en: string }[];
  makes: { id: number; name: string; type_ids: number[] }[];
  cities: { id: number; district_id: number; name_en: string }[];
  attributesSchema: any[];
  promoActive: boolean;
}

const STEPS = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Photos' },
  { id: 3, label: 'Location' },
  { id: 4, label: 'Review' },
];

export function PostAdWizard({
  vehicleTypes,
  districts,
  makes,
  cities,
  attributesSchema,
  promoActive,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<PostAdDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load draft from localStorage on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setDraft({ ...emptyDraft, ...(JSON.parse(raw) as PostAdDraft) });
    } catch {
      /* ignore */
    }
  }, []);

  // Persist draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  const updateDraft = (patch: Partial<PostAdDraft>) => setDraft((d) => ({ ...d, ...patch }));

  // Per-step validation — controls whether "Next" is enabled
  const canProceed = useMemo(() => {
    if (step === 1) {
      return (
        draft.vehicleTypeId !== null &&
        draft.makeId !== null &&
        draft.model.trim().length > 0 &&
        draft.year !== null &&
        draft.price !== null &&
        draft.price >= 1000
      );
    }
    if (step === 2) {
      return draft.imageUrls.length >= 3 && draft.imageUrls.length <= 6;
    }
    if (step === 3) {
      return draft.districtId !== null;
    }
    return true;
  }, [step, draft]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        vehicleTypeId: draft.vehicleTypeId,
        makeId: draft.makeId,
        model: draft.model,
        year: draft.year,
        price: draft.price,
        mileageKm: draft.mileageKm ?? undefined,
        engineCc: draft.engineCc ?? undefined,
        bodyType: draft.bodyType ?? undefined,
        transmission: draft.transmission ?? undefined,
        fuelType: draft.fuelType ?? undefined,
        condition: draft.condition,
        color: draft.color || undefined,
        previousOwners: draft.previousOwners ?? undefined,
        description: draft.description || undefined,
        districtId: draft.districtId,
        cityId: draft.cityId ?? undefined,
        lat: draft.lat ?? undefined,
        lng: draft.lng ?? undefined,
        customAttributes: draft.customAttributes,
        imageIds: draft.imageUrls, // URLs serve as IDs at this stage
      };

      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? 'Failed to post ad.');
        return;
      }

      localStorage.removeItem(DRAFT_KEY);
      router.push(`/dashboard?posted=${data.slug}`);
    } catch (err) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      {/* Promo banner */}
      {promoActive && (
        <div className="mb-4 rounded-full bg-[var(--brand-mint)] px-4 py-2 text-center text-sm font-medium text-[var(--brand-deep)]">
          🎉 Free posting active — first 100 sellers!
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div
                className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium',
                  step > s.id && 'bg-[var(--brand-green)] text-white',
                  step === s.id && 'bg-[var(--brand-deep)] text-white',
                  step < s.id && 'bg-gray-200 text-gray-400',
                )}
              >
                {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1',
                    step > s.id ? 'bg-[var(--brand-green)]' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs font-medium text-gray-500">
          Step {step} of 4: {STEPS[step - 1].label}
        </p>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 md:p-6">
        {step === 1 && (
          <StepDetails
            draft={draft}
            update={updateDraft}
            vehicleTypes={vehicleTypes}
            makes={makes}
            attributesSchema={attributesSchema}
          />
        )}
        {step === 2 && <StepImages draft={draft} update={updateDraft} />}
        {step === 3 && (
          <StepLocation draft={draft} update={updateDraft} districts={districts} cities={cities} />
        )}
        {step === 4 && (
          <StepReview
            draft={draft}
            vehicleTypes={vehicleTypes}
            makes={makes}
            districts={districts}
            cities={cities}
          />
        )}
      </div>

      {submitError && <p className="mt-3 text-center text-xs text-red-500">{submitError}</p>}

      {/* Sticky bottom action bar (mobile-friendly) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-border)] bg-white p-3 md:relative md:mt-4 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setStep((s) => s - 1)}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {step < 4 ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="flex-1"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              loading={submitting}
              className="flex-1"
            >
              Publish Ad
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
