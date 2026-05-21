'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';

interface District {
  id: number;
  name_en: string;
  name_si?: string | null;
  sort_order: number;
}

interface City {
  id: number;
  district_id: number;
  name_en: string;
  name_si?: string | null;
  sort_order: number;
}

interface Props {
  districts: District[];
  cities: City[];
}

export function LocationsEditor({ districts, cities }: Props) {
  const router = useRouter();
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(
    districts[0]?.id ?? null,
  );
  const [newCity, setNewCity] = useState({ name_en: '', name_si: '' });
  const [busy, setBusy] = useState(false);

  const filteredCities = useMemo(
    () => cities.filter((c) => c.district_id === selectedDistrict),
    [cities, selectedDistrict],
  );

  const addCity = async () => {
    if (!newCity.name_en.trim() || !selectedDistrict) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district_id: selectedDistrict,
          name_en: newCity.name_en.trim(),
          name_si: newCity.name_si.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Failed.');
        return;
      }
      setNewCity({ name_en: '', name_si: '' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const deleteCity = async (id: number) => {
    if (!confirm('Delete this city? Vehicles using it remain unaffected.')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/cities?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Failed.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Districts (read-only list) */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 lg:col-span-1">
        <h3 className="mb-3 text-sm font-medium">Districts ({districts.length})</h3>
        <p className="mb-3 text-xs text-gray-400">
          Click a district to manage its cities. Districts are fixed Sri Lankan administrative areas.
        </p>
        <ul className="max-h-[60vh] space-y-0.5 overflow-y-auto">
          {districts.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setSelectedDistrict(d.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedDistrict === d.id
                    ? 'bg-[var(--brand-bg)] font-medium text-[var(--brand-deep)]'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span>{d.name_en}</span>
                <span className="text-xs text-gray-400">
                  {cities.filter((c) => c.district_id === d.id).length}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Cities for selected district */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 lg:col-span-2">
        {selectedDistrict ? (
          <>
            <h3 className="mb-3 text-sm font-medium">
              Cities in {districts.find((d) => d.id === selectedDistrict)?.name_en}
            </h3>

            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
              <input
                type="text"
                value={newCity.name_en}
                onChange={(e) => setNewCity({ ...newCity, name_en: e.target.value })}
                placeholder="City name *"
                className="input md:col-span-2"
              />
              <input
                type="text"
                value={newCity.name_si}
                onChange={(e) => setNewCity({ ...newCity, name_si: e.target.value })}
                placeholder="Sinhala (optional)"
                className="input"
              />
              <Button variant="primary" size="md" onClick={addCity} loading={busy}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {filteredCities.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No cities yet.</p>
            ) : (
              <ul className="grid max-h-[60vh] grid-cols-1 gap-1 overflow-y-auto md:grid-cols-2">
                {filteredCities.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    <div>
                      <p>{c.name_en}</p>
                      {c.name_si && (
                        <p className="text-xs text-gray-400 lang-si">{c.name_si}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCity(c.id)}
                      disabled={busy}
                      className="rounded p-1 text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">Select a district to manage cities.</p>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.625rem;
          font-size: 0.875rem;
          border: 1px solid var(--color-border);
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
