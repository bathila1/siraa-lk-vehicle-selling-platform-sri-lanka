'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react';

import { Button } from '@/components/ui/Button';

interface Attribute {
  id: number;
  vehicle_type_id: number | null;
  field_key: string;
  label_en: string;
  label_si: string | null;
  field_type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  options: { value: string; label_en: string }[] | null;
  required: boolean;
  sort_order: number;
  active: boolean;
}

interface VehicleType {
  id: number;
  name_en: string;
}

interface Props {
  attributes: Attribute[];
  types: VehicleType[];
}

const emptyNew: Omit<Attribute, 'id'> = {
  vehicle_type_id: null,
  field_key: '',
  label_en: '',
  label_si: '',
  field_type: 'text',
  options: null,
  required: false,
  sort_order: 999,
  active: true,
};

export function AttributesEditor({ attributes: initial, types }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newAttr, setNewAttr] = useState<Omit<Attribute, 'id'>>(emptyNew);
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!newAttr.field_key.trim() || !newAttr.label_en.trim()) {
      alert('Field key and English label are required.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/admin/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAttr,
          field_key: newAttr.field_key
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/^_+|_+$/g, ''),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Failed.');
        return;
      }
      setNewAttr(emptyNew);
      setAdding(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add button / form */}
      {!adding ? (
        <Button variant="primary" size="md" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Add Custom Field
        </Button>
      ) : (
        <div className="rounded-xl border-2 border-[var(--brand-green)] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">New Custom Field</h3>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewAttr(emptyNew);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          <AttributeForm
            value={newAttr}
            onChange={(v) => setNewAttr(v)}
            types={types}
          />
          <div className="mt-3 flex justify-end">
            <Button variant="primary" size="md" onClick={handleAdd} loading={busy}>
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </div>
        </div>
      )}

      {/* Existing list */}
      <div className="space-y-2">
        {initial.length === 0 ? (
          <p className="rounded-xl border border-[var(--color-border)] bg-white py-12 text-center text-sm text-gray-400">
            No custom fields yet. Add one above to get started.
          </p>
        ) : (
          initial.map((attr) => (
            <AttributeRow key={attr.id} attr={attr} types={types} />
          ))
        )}
      </div>

      <Style />
    </div>
  );
}

function AttributeRow({ attr, types }: { attr: Attribute; types: VehicleType[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [edited, setEdited] = useState(attr);
  const [busy, setBusy] = useState(false);

  const typeName =
    attr.vehicle_type_id === null
      ? 'All types'
      : types.find((t) => t.id === attr.vehicle_type_id)?.name_en ?? '?';

  const handleSave = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/attributes?id=${attr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edited),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Failed.');
        return;
      }
      setExpanded(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this field? Existing vehicles with this attribute keep their values, but the field disappears from the form.')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/attributes?id=${attr.id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('Delete failed.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white">
      {/* Collapsed summary row */}
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{attr.label_en}</span>
              <span className="font-mono text-[10px] text-gray-400">{attr.field_key}</span>
              {attr.required && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-600">required</span>
              )}
              {!attr.active && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">inactive</span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {attr.field_type} · {typeName}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="rounded p-1.5 text-red-600 hover:bg-red-50"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] bg-[var(--brand-bg)] p-4">
          <AttributeForm value={edited} onChange={setEdited} types={types} />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEdited(attr);
                setExpanded(false);
              }}
              className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={busy}>
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AttributeForm({
  value,
  onChange,
  types,
}: {
  value: Omit<Attribute, 'id'> | Attribute;
  onChange: (v: any) => void;
  types: VehicleType[];
}) {
  const isSelect = value.field_type === 'select' || value.field_type === 'multiselect';

  // Render options as text (one per line: value|label)
  const optionsText = (value.options ?? [])
    .map((o) => `${o.value}|${o.label_en}`)
    .join('\n');

  const handleOptionsChange = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim());
    const opts = lines.map((line) => {
      const [val, ...rest] = line.split('|').map((s) => s.trim());
      return { value: val, label_en: rest.join('|') || val };
    });
    onChange({ ...value, options: opts });
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Field label="English Label *">
        <input
          type="text"
          value={value.label_en}
          onChange={(e) => onChange({ ...value, label_en: e.target.value })}
          placeholder="e.g. Has Sunroof"
          className="input"
        />
      </Field>

      <Field label="Sinhala Label">
        <input
          type="text"
          value={value.label_si ?? ''}
          onChange={(e) => onChange({ ...value, label_si: e.target.value })}
          placeholder="Optional"
          className="input"
        />
      </Field>

      <Field label="Field Key * (snake_case, no spaces)">
        <input
          type="text"
          value={value.field_key}
          onChange={(e) =>
            onChange({
              ...value,
              field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            })
          }
          placeholder="e.g. has_sunroof"
          className="input font-mono"
        />
      </Field>

      <Field label="Field Type *">
        <select
          value={value.field_type}
          onChange={(e) =>
            onChange({
              ...value,
              field_type: e.target.value as Attribute['field_type'],
              // Reset options when leaving select types
              options:
                e.target.value === 'select' || e.target.value === 'multiselect'
                  ? value.options ?? []
                  : null,
            })
          }
          className="input"
        >
          <option value="text">Text input</option>
          <option value="number">Number</option>
          <option value="boolean">Yes/No checkbox</option>
          <option value="select">Single select (dropdown)</option>
          <option value="multiselect">Multi select (chips)</option>
        </select>
      </Field>

      <Field label="Applies to Vehicle Type">
        <select
          value={value.vehicle_type_id ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              vehicle_type_id: e.target.value === '' ? null : Number(e.target.value),
            })
          }
          className="input"
        >
          <option value="">All vehicle types</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name_en}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Sort Order">
        <input
          type="number"
          value={value.sort_order}
          onChange={(e) => onChange({ ...value, sort_order: Number(e.target.value) })}
          className="input"
        />
      </Field>

      {isSelect && (
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Options (one per line, format: <span className="font-mono">value|Label</span>)
          </label>
          <textarea
            value={optionsText}
            onChange={(e) => handleOptionsChange(e.target.value)}
            placeholder={'leather|Leather Seats\nfabric|Fabric Seats\nsport|Sport Seats'}
            rows={4}
            className="input resize-y font-mono text-xs"
          />
          <p className="mt-1 text-[10px] text-gray-400">
            One option per line. <code>value</code> = stored in DB. <code>Label</code> = shown to user.
          </p>
        </div>
      )}

      <div className="md:col-span-2 flex flex-wrap gap-4 pt-1">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.required}
            onChange={(e) => onChange({ ...value, required: e.target.checked })}
            className="accent-[var(--brand-green)]"
          />
          Required field
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.active}
            onChange={(e) => onChange({ ...value, active: e.target.checked })}
            className="accent-[var(--brand-green)]"
          />
          Active (show on post-ad form)
        </label>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700">{label}</label>
      {children}
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