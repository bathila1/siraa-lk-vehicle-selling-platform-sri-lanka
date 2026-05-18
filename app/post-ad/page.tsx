import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { Header } from '@/components/shared/Header';
import { PostAdWizard } from '@/components/post-ad/PostAdWizard';
import { getSession } from '@/lib/auth/session';
import { getVehicleTypes, getDistricts, getVehicleMakesByType } from '@/lib/db/queries';
import { createServiceClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Post Your Ad' };

export default async function PostAdPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/post-ad');

  // Reference data
  const [vehicleTypes, districts, makes] = await Promise.all([
    getVehicleTypes(),
    getDistricts(),
    getVehicleMakesByType(),
  ]);

  // Load attribute schema and promo state
  const supabase = createServiceClient();
  const [{ data: attrSchema }, { data: promoSetting }, { data: cities }] = await Promise.all([
    supabase.from('vehicle_attributes_schema').select('*').eq('active', true).order('sort_order'),
    supabase.from('site_settings').select('value').eq('key', 'promo_first_100_sellers').single(),
    supabase.from('cities').select('id, district_id, name_en').order('sort_order'),
  ]);

  const promoActive =
    promoSetting?.value?.active === true &&
    (promoSetting?.value?.current_count ?? 0) < (promoSetting?.value?.max_count ?? 100);

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3.5rem)] bg-[var(--brand-bg)]">
        <PostAdWizard
          vehicleTypes={vehicleTypes}
          districts={districts}
          makes={makes}
          cities={cities ?? []}
          attributesSchema={attrSchema ?? []}
          promoActive={promoActive}
        />
      </main>
    </>
  );
}
