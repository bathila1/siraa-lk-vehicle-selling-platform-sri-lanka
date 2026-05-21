'use client';

import { useMemo } from 'react';
import type { PostAdDraft } from './PostAdWizard';

interface Props {
  draft: PostAdDraft;
  update: (patch: Partial<PostAdDraft>) => void;
  vehicleTypes: { id: number; name_en: string }[];
  makes: { id: number; name: string; type_ids: number[] }[];
  attributesSchema: any[];
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

export function StepDetails({ draft, update, vehicleTypes, makes, attributesSchema }: Props) {
  // Filter makes by selected vehicle type
  const filteredMakes = useMemo(() => {
    if (!draft.vehicleTypeId) return makes;
    return makes.filter((m) => m.type_ids.includes(draft.vehicleTypeId!));
  }, [makes, draft.vehicleTypeId]);

  // Custom attributes applicable to selected type
  const relevantAttrs = useMemo(
    () =>
      attributesSchema.filter(
        (a) => a.vehicle_type_id === null || a.vehicle_type_id === draft.vehicleTypeId,
      ),
    [attributesSchema, draft.vehicleTypeId],
  );

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Vehicle Details</h2>

      {/* Vehicle type */}
      <Field label="Vehicle Type" required>
        <select
          value={draft.vehicleTypeId ?? ''}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null;
            // Reset make when type changes if make no longer fits
            const make = makes.find((m) => m.id === draft.makeId);
            const stillValid = make && id && make.type_ids.includes(id);
            update({ vehicleTypeId: id, makeId: stillValid ? draft.makeId : null });
          }}
          className="input"
        >
          <option value="">Select vehicle type</option>
          {vehicleTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name_en}
            </option>
          ))}
        </select>
      </Field>

      {/* Make */}
      <Field label="Make" required>
        <select
          value={draft.makeId ?? ''}
          onChange={(e) => update({ makeId: e.target.value ? Number(e.target.value) : null })}
          className="input"
          disabled={!draft.vehicleTypeId}
        >
          <option value="">
            {draft.vehicleTypeId ? 'Select make' : 'Select vehicle type first'}
          </option>
          {filteredMakes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Model */}
      <Field label="Model" required>
        <input
          type="text"
          placeholder="e.g. Aqua, Civic, Tipper"
          value={draft.model}
          onChange={(e) => update({ model: e.target.value })}
          className="input"
          maxLength={60}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        {/* Year */}
        <Field label="Year" required>
          <select
            value={draft.year ?? ''}
            onChange={(e) => update({ year: e.target.value ? Number(e.target.value) : null })}
            className="input"
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>

        {/* Price */}
        <Field label="Price (LKR)" required>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 4500000"
            value={draft.price ?? ''}
            onChange={(e) => update({ price: e.target.value ? Number(e.target.value) : null })}
            className="input"
            min={1000}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mileage (km)">
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 75000"
            value={draft.mileageKm ?? ''}
            onChange={(e) => update({ mileageKm: e.target.value ? Number(e.target.value) : null })}
            className="input"
          />
        </Field>

        <Field label="Engine (cc)">
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 1500"
            value={draft.engineCc ?? ''}
            onChange={(e) => update({ engineCc: e.target.value ? Number(e.target.value) : null })}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Transmission">
          <select
            value={draft.transmission ?? ''}
            onChange={(e) => update({ transmission: e.target.value || null })}
            className="input"
          >
            <option value="">Select</option>
            <option value="auto">Automatic</option>
            <option value="manual">Manual</option>
            <option value="tiptronic">Tiptronic</option>
            <option value="cvt">CVT</option>
          </select>
        </Field>

        <Field label="Fuel Type">
          <select
            value={draft.fuelType ?? ''}
            onChange={(e) => update({ fuelType: e.target.value || null })}
            className="input"
          >
            <option value="">Select</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
            <option value="cng">CNG</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Body Type">
          <select
            value={draft.bodyType ?? ''}
            onChange={(e) => update({ bodyType: e.target.value || null })}
            className="input"
          >
            <option value="">Select</option>
            <option value="sedan">Sedan</option>
            <option value="hatchback">Hatchback</option>
            <option value="suv">SUV</option>
            <option value="wagon">Wagon</option>
            <option value="coupe">Coupe</option>
            <option value="pickup">Pickup</option>
            <option value="van">Van</option>
            <option value="mpv">MPV</option>
            <option value="convertible">Convertible</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <Field label="Color">
          <input
            type="text"
            placeholder="e.g. Pearl White"
            value={draft.color}
            onChange={(e) => update({ color: e.target.value })}
            className="input"
            maxLength={30}
          />
        </Field>
      </div>

      <Field label="ඔබ කී වෙනි owner ද?">
 <select
          value={draft.previousOwners ?? ''}
          onChange={(e) =>
            update({ previousOwners: e.target.value !== '' ? Number(e.target.value) : null })
          }
          className="input"
        >
          <option value="">Select</option>
          <option value="0">First Owner</option>
          <option value="1">Second Owner</option>
          <option value="2">Third Owner</option>
          <option value="3">Fourth Owner</option>
          <option value="4">Fifth Owner</option>
          <option value="5">Sixth Owner</option>
          <option value="6">Seventh Owner</option>
          <option value="7">Eighth Owner</option>
          <option value="8">Ninth Owner</option>
          <option value="9">Tenth Owner</option>
        </select>
      </Field>

      <Field label="Description">
        <textarea
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Tell buyers about condition, service history, accessories..."
          maxLength={5000}
          rows={4}
          className="input resize-none"
        />
        <p className="mt-1 text-xs text-gray-400">{draft.description.length}/5000</p>
      </Field>

      {/* Dynamic custom attributes */}
      {relevantAttrs.length > 0 && (
        <div className="border-t border-[var(--color-border)] pt-3">
          <h3 className="mb-3 text-sm font-medium">Additional Info</h3>
          <div className="space-y-3">
            {relevantAttrs.map((attr) => (
              <CustomAttributeField
                key={attr.id}
                attr={attr}
                value={draft.customAttributes[attr.field_key]}
                onChange={(v) =>
                  update({
                    customAttributes: { ...draft.customAttributes, [attr.field_key]: v },
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.75rem;
          font-size: 0.875rem;
          border: 1.5px solid var(--color-border);
          border-radius: 0.5rem;
          outline: none;
          background: white;
          transition: border-color 0.15s;
        }
        :global(.input:focus) {
          border-color: var(--brand-green);
        }
        :global(.input:disabled) {
          background: #f9fafb;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function CustomAttributeField({
  attr,
  value,
  onChange,
}: {
  attr: any;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (attr.field_type === 'boolean') {
    return (
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-[var(--brand-green)]"
        />
        <span className="text-sm">{attr.label_en}</span>
      </label>
    );
  }

  if (attr.field_type === 'select') {
    return (
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">{attr.label_en}</label>
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="input"
        >
          <option value="">Select</option>
          {(attr.options ?? []).map((o: any) => (
            <option key={o.value} value={o.value}>
              {o.label_en}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (attr.field_type === 'multiselect') {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">{attr.label_en}</label>
        <div className="flex flex-wrap gap-1.5">
          {(attr.options ?? []).map((o: any) => {
            const active = arr.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  onChange(active ? arr.filter((v) => v !== o.value) : [...arr, o.value])
                }
                className={`rounded-full border px-2.5 py-1.5 text-xs transition-colors ${
                  active
                    ? 'border-[var(--brand-green)] bg-[var(--brand-green)] text-white'
                    : 'border-[var(--color-border)] text-gray-600'
                }`}
              >
                {o.label_en}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (attr.field_type === 'number') {
    return (
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">{attr.label_en}</label>
        <input
          type="number"
          inputMode="numeric"
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="input"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">{attr.label_en}</label>
      <input
        type="text"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </div>
  );
}
