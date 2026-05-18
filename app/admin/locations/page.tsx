import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSession } from '@/lib/auth/admin-session';

export default async function LocationsPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return (
    <AdminShell title="Districts & Cities" subtitle="Manage Sri Lankan locations.">
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 text-center">
        <p className="text-sm text-gray-500 mb-4">
          Edit via Supabase Table Editor. Already seeded with all 25 districts and major cities.
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
          Tables: <code className="bg-gray-100 px-1 py-0.5 rounded">districts</code>,{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded">cities</code>
        </p>
      </div>
    </AdminShell>
  );
}
