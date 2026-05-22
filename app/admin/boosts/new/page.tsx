import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { ManualBoostForm } from '@/components/admin/ManualBoostForm';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';

export default async function NewManualBoostPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const supabase = createServiceClient();
  const { data: plans } = await supabase
    .from('boost_plans')
    .select('id, name, type, duration_days, price')
    .eq('active', true)
    .order('sort_order');

  return (
    <AdminShell
      title="Manual Boost"
      subtitle="Grant a boost to a vehicle without payment (for promotions, comps, refund recovery)."
    >
      <ManualBoostForm plans={plans ?? []} />
    </AdminShell>
  );
}