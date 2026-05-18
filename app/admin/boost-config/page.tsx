import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { BoostConfigForm } from '@/components/admin/BoostConfigForm';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';

export default async function BoostConfigPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const supabase = createServiceClient();
  const [{ data: plans }, { data: slots }] = await Promise.all([
    supabase.from('boost_plans').select('*').order('sort_order'),
    supabase.from('boost_slot_config').select('*').order('slot_key'),
  ]);

  return (
    <AdminShell
      title="Boost Configuration"
      subtitle="Pricing and placement settings. Changes apply immediately."
    >
      <BoostConfigForm plans={plans ?? []} slots={slots ?? []} />
    </AdminShell>
  );
}
