import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { PostAdWizard } from '@/components/post-ad/PostAdWizard';
import { getSession } from '@/lib/auth/session';
import { getVehicleTypes, getDistricts, getVehicleMakesByType } from '@/lib/db/queries';
import { createServiceClient } from '@/lib/supabase/server';
import { LayoutDashboard, PlusCircle } from 'lucide-react';
import Link from 'next/link';

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
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white shadow-sm">
      <div className="container mx-auto px-4">
        {/* Main row */}
        <div className="flex h-14 items-center gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 text-xl font-bold tracking-tight text-[var(--brand-deep)]"
          >
            Siraa<span className="text-green-500">.lk</span>
          </Link>

          {/* Nav actions */}
          <nav className="ml-auto flex items-center gap-1">
            {/* MY ADS — outlined (secondary) */}
              <>
                <Link
                  href="/dashboard"
                  className="items-center gap-2 rounded-xl border-2 border-[var(--brand-green)] bg-white px-2 py-[3px] text-sm font-semibold text-[var(--brand-green)] transition-all duration-200 hover:bg-[var(--brand-green)] hover:text-white active:scale-95 sm:inline-flex sm:px-4"
                  aria-label="My Ads Dashboard"
                >
                  <span>My Ads</span>
                </Link>
              </>
          </nav>
        </div>
      </div>
    </div>
      {/* Header end */}
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
