import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { TypesAndMakesEditor } from '@/components/admin/TypesAndMakesEditor';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';

export default async function TypesAndMakesPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const supabase = createServiceClient();
  const [{ data: types }, { data: makes }] = await Promise.all([
    supabase.from('vehicle_types').select('*').order('sort_order'),
    supabase
      .from('vehicle_makes')
      .select('id, name, slug, type_ids, sort_order, active')
      .order('name'),
  ]);

  return (
    <AdminShell
      title="Vehicle Types & Makes"
      subtitle="Manage the taxonomy used in vehicle listings."
    >
      <TypesAndMakesEditor types={types ?? []} makes={makes ?? []} />
    </AdminShell>
  );
}
