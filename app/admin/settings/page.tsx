import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';

export default async function SiteSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const supabase = createServiceClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .order('key');

  return (
    <AdminShell
      title="Site Settings"
      subtitle="Site-wide configuration. Changes apply immediately."
    >
      <SiteSettingsForm settings={settings ?? []} />
    </AdminShell>
  );
}
