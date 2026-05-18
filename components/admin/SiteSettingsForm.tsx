'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';

interface Setting {
  key: string;
  value: any;
  description: string | null;
}

interface Props {
  settings: Setting[];
}

export function SiteSettingsForm({ settings }: Props) {
  return (
    <div className="space-y-4">
      {settings.map((s) => (
        <SettingCard key={s.key} setting={s} />
      ))}
    </div>
  );
}

function SettingCard({ setting }: { setting: Setting }) {
  const router = useRouter();
  const [json, setJson] = useState(JSON.stringify(setting.value, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const handleSave = async () => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: setting.key, value: parsed }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Save failed.');
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-xl border border-[var(--color-border)] p-4">
      <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold">{setting.key}</p>
          {setting.description && (
            <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {savedAt && Date.now() - savedAt < 5000 && (
            <span className="text-xs text-[var(--brand-green)]">✓ Saved</span>
          )}
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>
        </div>
      </div>
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={Math.min(json.split('\n').length + 1, 16)}
        className="w-full p-3 text-xs font-mono border border-[var(--color-border)] rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-[var(--brand-green)]"
        spellCheck={false}
      />
      {error && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </section>
  );
}
