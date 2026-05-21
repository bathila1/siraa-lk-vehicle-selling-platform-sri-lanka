import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { AttributesEditor } from '@/components/admin/AttributesEditor';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';

export default async function AttributesAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const supabase = createServiceClient();
  const [{ data: attrs }, { data: types }] = await Promise.all([
    supabase.from('vehicle_attributes_schema').select('*').order('sort_order'),
    supabase.from('vehicle_types').select('id, name_en').order('sort_order'),
  ]);

  return (
    <AdminShell
      title="Custom Attributes"
      subtitle="Define extra fields shown on the post-ad form per vehicle type."
    >
      <AttributesEditor attributes={attrs ?? []} types={types ?? []} />
    </AdminShell>
  );
}