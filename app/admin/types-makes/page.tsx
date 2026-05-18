import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSession } from '@/lib/auth/admin-session';

export default async function TypesAndMakesPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return (
    <AdminShell title="Vehicle Types & Makes" subtitle="Manage the vehicle taxonomy.">
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 text-center">
        <p className="text-sm text-gray-500 mb-4">
          Direct editing in Supabase Dashboard for now. Web UI editor coming in a future release.
        </p>
        <Link
          href="https://supabase.com/dashboard/project/bdyyzfawulwlqxzrfgtb/editor"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--brand-green)] hover:underline"
        >
          Open Supabase Table Editor
          <ExternalLink className="w-3 h-3" />
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          Tables: <code className="bg-gray-100 px-1 py-0.5 rounded">vehicle_types</code>,{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded">vehicle_makes</code>
        </p>
      </div>
    </AdminShell>
  );
}
