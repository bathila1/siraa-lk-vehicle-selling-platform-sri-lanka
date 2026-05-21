'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Eye, EyeOff } from 'lucide-react';

export function BlogRowActions({
  postId,
  published,
}: {
  postId: number;
  published: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const togglePublish = async () => {
    if (!confirm(published ? 'Unpublish this post?' : 'Publish this post?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: published ? 'unpublish' : 'publish' }),
      });
      if (!res.ok) {
        alert('Failed.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post permanently? This cannot be undone.')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('Failed.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={togglePublish}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-gray-100"
        title={published ? 'Unpublish' : 'Publish'}
      >
        {published ? (
          <EyeOff className="h-3 w-3 text-gray-600" />
        ) : (
          <Eye className="h-3 w-3 text-[var(--brand-green)]" />
        )}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
        title="Delete"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </>
  );
}
