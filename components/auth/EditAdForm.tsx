'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { formatLKR } from '@/lib/utils';

interface Props {
  vehicle: any;
  vehicleTypes: { id: number; name_en: string }[];
  districts: { id: number; name_en: string }[];
  makes: { id: number; name: string; type_ids: number[] }[];
  cities: { id: number; district_id: number; name_en: string }[];
}

export function EditAdForm({ vehicle, vehicleTypes, districts, makes, cities }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    mileageKm: vehicle.mileage_km,
    description: vehicle.description ?? '',
    districtId: vehicle.district_id,
    cityId: vehicle.city_id,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCities = useMemo(
    () => cities.filter((c) => c.district_id === form.districtId),
    [cities, form.districtId],
  );

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-4 md:p-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--brand-green)]"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to dashboard
      </Link>

      <p className="text-xs text-gray-500">
        Note: To change photos or vehicle type, delete this ad and post a new one.
      </p>

      <Field label="Model">
        <input
          type="text"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Year">
          <input
            type="number"
            value={form.year ?? ''}
            onChange={(e) =>
              setForm({ ...form, year: e.target.value ? Number(e.target.value) : null })
            }
            className="input"
          />
        </Field>
        <Field label="Price (LKR)">
          <input
            type="number"
            value={form.price ?? ''}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value ? Number(e.target.value) : null })
            }
            className="input"
          />
        </Field>
      </div>

      <p className="text-xs text-gray-400">
        Current: {formatLKR(form.price)}{' '}
        {form.price !== vehicle.price && '(changed from ' + formatLKR(vehicle.price) + ')'}
      </p>

      <Field label="Mileage (km)">
        <input
          type="number"
          value={form.mileageKm ?? ''}
          onChange={(e) =>
            setForm({ ...form, mileageKm: e.target.value ? Number(e.target.value) : null })
          }
          className="input"
        />
      </Field>

      <Field label="District">
        <select
          value={form.districtId ?? ''}
          onChange={(e) => setForm({ ...form, districtId: Number(e.target.value), cityId: null })}
          className="input"
        >
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name_en}
            </option>
          ))}
        </select>
      </Field>

      {filteredCities.length > 0 && (
        <Field label="City">
          <select
            value={form.cityId ?? ''}
            onChange={(e) =>
              setForm({ ...form, cityId: e.target.value ? Number(e.target.value) : null })
            }
            className="input"
          >
            <option value="">Select city</option>
            {filteredCities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          maxLength={5000}
          className="input resize-none"
        />
      </Field>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="md"
          onClick={() => router.push('/dashboard')}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          loading={loading}
          className="flex-1"
        >
          Save Changes
        </Button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.75rem;
          font-size: 0.875rem;
          border: 1.5px solid var(--color-border);
          border-radius: 0.5rem;
          outline: none;
          background: white;
        }
        .input:focus {
          border-color: var(--brand-green);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
