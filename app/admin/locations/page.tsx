import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { LocationsEditor } from '@/components/admin/LocationsEditor';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';

export default async function LocationsAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const supabase = createServiceClient();
  const [{ data: districts }, { data: cities }] = await Promise.all([
    supabase.from('districts').select('*').order('sort_order'),
    supabase.from('cities').select('*').order('district_id, sort_order'),
  ]);

  return (
    <AdminShell
      title="Districts & Cities"
      subtitle="Manage Sri Lankan locations used in vehicle listings."
    >
      <LocationsEditor districts={districts ?? []} cities={cities ?? []} />
    </AdminShell>
  );
}
