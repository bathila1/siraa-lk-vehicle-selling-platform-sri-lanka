'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/Button';

interface VehicleType {
  id: number;
  name_en: string;
  name_si?: string | null;
  slug: string;
  sort_order: number;
  active: boolean;
}

interface VehicleMake {
  id: number;
  name: string;
  slug: string;
  type_ids: number[];
  sort_order: number;
  active: boolean;
}

interface Props {
  types: VehicleType[];
  makes: VehicleMake[];
}

export function TypesAndMakesEditor({ types: initialTypes, makes: initialMakes }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'types' | 'makes'>('types');

  return (
    <div>
      <div className="mb-4 flex gap-2 border-b border-[var(--color-border)]">
        {[
          { id: 'types', label: 'Vehicle Types', count: initialTypes.length },
          { id: 'makes', label: 'Makes / Brands', count: initialMakes.length },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`px-3 py-2 text-sm transition-colors ${
              tab === t.id
                ? 'border-b-2 border-[var(--brand-green)] text-[var(--brand-deep)] font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label} <span className="text-xs text-gray-400">({t.count})</span>
          </button>
        ))}
      </div>

      {tab === 'types' ? (
        <TypesPanel initialTypes={initialTypes} onChange={() => router.refresh()} />
      ) : (
        <MakesPanel
          initialMakes={initialMakes}
          types={initialTypes}
          onChange={() => router.refresh()}
        />
      )}
    </div>
  );
}

function TypesPanel({
  initialTypes,
  onChange,
}: {
  initialTypes: VehicleType[];
  onChange: () => void;
}) {
  const [types, setTypes] = useState(initialTypes);
  const [newType, setNewType] = useState({ name_en: '', name_si: '', slug: '' });
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!newType.name_en.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_en: newType.name_en.trim(),
          name_si: newType.name_si.trim() || null,
          slug:
            newType.slug.trim() ||
            newType.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Failed.');
        return;
      }
      setNewType({ name_en: '', name_si: '', slug: '' });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (type: VehicleType) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/types?id=${type.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_en: type.name_en,
          name_si: type.name_si,
          sort_order: type.sort_order,
          active: type.active,
        }),
      });
      if (!res.ok) alert('Save failed.');
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this type? Vehicles using it will not be affected, but you cannot post new ads with it.'))
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/types?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Delete failed.');
        return;
      }
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h3 className="mb-2 text-sm font-medium">Add new type</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input
            type="text"
            value={newType.name_en}
            onChange={(e) => setNewType({ ...newType, name_en: e.target.value })}
            placeholder="English name *"
            className="input"
          />
          <input
            type="text"
            value={newType.name_si}
            onChange={(e) => setNewType({ ...newType, name_si: e.target.value })}
            placeholder="Sinhala (optional)"
            className="input"
          />
          <input
            type="text"
            value={newType.slug}
            onChange={(e) =>
              setNewType({
                ...newType,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
              })
            }
            placeholder="slug (auto-generated)"
            className="input font-mono"
          />
          <Button variant="primary" size="md" onClick={handleAdd} loading={busy}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-bg)] text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name (English)</th>
              <th className="px-3 py-2 text-left font-medium">Sinhala</th>
              <th className="px-3 py-2 text-left font-medium">Slug</th>
              <th className="px-3 py-2 text-left font-medium">Sort</th>
              <th className="px-3 py-2 text-left font-medium">Active</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.map((type, idx) => (
              <tr key={type.id} className="border-t border-[var(--color-border)]">
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={type.name_en}
                    onChange={(e) => {
                      const next = [...types];
                      next[idx] = { ...type, name_en: e.target.value };
                      setTypes(next);
                    }}
                    className="input"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={type.name_si ?? ''}
                    onChange={(e) => {
                      const next = [...types];
                      next[idx] = { ...type, name_si: e.target.value };
                      setTypes(next);
                    }}
                    className="input"
                  />
                </td>
                <td className="px-2 py-2 font-mono text-xs text-gray-500">{type.slug}</td>
                <td className="px-2 py-2 w-20">
                  <input
                    type="number"
                    value={type.sort_order}
                    onChange={(e) => {
                      const next = [...types];
                      next[idx] = { ...type, sort_order: Number(e.target.value) };
                      setTypes(next);
                    }}
                    className="input"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={type.active}
                    onChange={(e) => {
                      const next = [...types];
                      next[idx] = { ...type, active: e.target.checked };
                      setTypes(next);
                    }}
                    className="accent-[var(--brand-green)]"
                  />
                </td>
                <td className="px-2 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleUpdate(type)}
                      disabled={busy}
                      className="rounded p-1.5 text-xs text-[var(--brand-green)] hover:bg-green-50"
                      title="Save"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(type.id)}
                      disabled={busy}
                      className="rounded p-1.5 text-xs text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Style />
    </div>
  );
}

function MakesPanel({
  initialMakes,
  types,
  onChange,
}: {
  initialMakes: VehicleMake[];
  types: VehicleType[];
  onChange: () => void;
}) {
  const [filter, setFilter] = useState('');
  const [newMake, setNewMake] = useState({
    name: '',
    slug: '',
    type_ids: [] as number[],
  });
  const [busy, setBusy] = useState(false);

  const filtered = initialMakes.filter((m) =>
    m.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleAdd = async () => {
    if (!newMake.name.trim() || newMake.type_ids.length === 0) {
      alert('Name and at least one type required.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/makes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMake.name.trim(),
          slug:
            newMake.slug.trim() ||
            newMake.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          type_ids: newMake.type_ids,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Failed.');
        return;
      }
      setNewMake({ name: '', slug: '', type_ids: [] });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this make? Existing vehicles using it remain unaffected.'))
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/makes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Failed.');
        return;
      }
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (id: number, active: boolean) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/makes?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h3 className="mb-2 text-sm font-medium">Add new make</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input
            type="text"
            value={newMake.name}
            onChange={(e) => setNewMake({ ...newMake, name: e.target.value })}
            placeholder="e.g. Toyota"
            className="input"
          />
          <input
            type="text"
            value={newMake.slug}
            onChange={(e) =>
              setNewMake({
                ...newMake,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
              })
            }
            placeholder="slug (auto)"
            className="input font-mono"
          />
          <TypeMultiSelect
            types={types}
            selected={newMake.type_ids}
            onChange={(ids) => setNewMake({ ...newMake, type_ids: ids })}
          />
          <Button variant="primary" size="md" onClick={handleAdd} loading={busy}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Select one or more vehicle types this make applies to.
        </p>
      </div>

      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter makes..."
        className="input max-w-sm"
      />

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-bg)] text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Slug</th>
              <th className="px-3 py-2 text-left font-medium">Types</th>
              <th className="px-3 py-2 text-left font-medium">Active</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No makes found
                </td>
              </tr>
            ) : (
              filtered.map((make) => (
                <tr key={make.id} className="border-t border-[var(--color-border)]">
                  <td className="px-3 py-2 font-medium">{make.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{make.slug}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {(make.type_ids ?? [])
                      .map((id) => types.find((t) => t.id === id)?.name_en)
                      .filter(Boolean)
                      .join(', ')}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={make.active}
                      onChange={(e) => handleToggleActive(make.id, e.target.checked)}
                      className="accent-[var(--brand-green)]"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(make.id)}
                      disabled={busy}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Style />
    </div>
  );
}

function TypeMultiSelect({
  types,
  selected,
  onChange,
}: {
  types: VehicleType[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const label =
    selected.length === 0
      ? 'Pick types...'
      : selected.length === 1
      ? types.find((t) => t.id === selected[0])?.name_en
      : `${selected.length} types`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between text-left"
      >
        <span className={selected.length === 0 ? 'text-gray-400' : ''}>{label}</span>
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[var(--color-border)] bg-white shadow-lg">
          {types.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(t.id)}
                onChange={() => toggle(t.id)}
                className="accent-[var(--brand-green)]"
              />
              {t.name_en}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function Style() {
  return (
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
  );
}
