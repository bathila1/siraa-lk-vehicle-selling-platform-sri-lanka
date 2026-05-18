import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSession } from '@/lib/auth/admin-session';

export default async function AttributesPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return (
    <AdminShell title="Custom Attributes Schema" subtitle="Add or remove extra fields per vehicle type.">
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 text-center">
        <p className="text-sm text-gray-500 mb-4">
          Direct editing in Supabase Dashboard. Each row = one custom field that sellers see on post-ad.
        </p>
        <Link
          href="https://supabase.com/dashboard/project/bdyyzfawulwlqxzrfgtb/editor"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--brand-green)] hover:underline"
        >
          Open Table Editor
          <ExternalLink className="w-3 h-3" />
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          Table: <code className="bg-gray-100 px-1 py-0.5 rounded">vehicle_attributes_schema</code>
        </p>
      </div>
    </AdminShell>
  );
}
