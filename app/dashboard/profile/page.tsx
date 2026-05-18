import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { Header } from '@/components/shared/Header';
import { ProfileSetupForm } from '@/components/auth/ProfileSetupForm';
import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { getDistricts } from '@/lib/db/queries';

export const metadata: Metadata = { title: 'Complete Your Profile' };

interface Props {
  searchParams: Promise<{ welcome?: string }>;
}

export default async function ProfilePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard/profile');

  const { welcome } = await searchParams;

  const supabase = createServiceClient();
  const [{ data: seller }, districts] = await Promise.all([
    supabase
      .from('sellers')
      .select('full_name, district_id, city_id, whatsapp_number, phone')
      .eq('id', session.seller_id)
      .single(),
    getDistricts(),
  ]);

  if (!seller) redirect('/login');

  // // If profile already complete and not in welcome flow, redirect to dashboard
  // if (seller.full_name !== 'New Seller' && !welcome) {
  //   redirect('/dashboard');
  // }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center px-4 py-8 bg-[var(--brand-bg)]">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-[var(--color-border)] p-6">
          <h1 className="text-lg font-bold mb-1">
            {welcome ? 'Welcome to Siraa! 🎉' : 'Edit Profile'}
          </h1>
          <p className="text-xs text-gray-500 mb-5">
            {welcome
              ? 'Tell us a little about yourself before you post your first ad.'
              : 'Update your details.'}
          </p>
          <ProfileSetupForm
            initialName={seller.full_name === 'New Seller' ? '' : seller.full_name}
            initialDistrictId={seller.district_id}
            initialWhatsapp={seller.whatsapp_number ?? seller.phone}
            phone={seller.phone}
            districts={districts}
          />
        </div>
      </main>
    </>
  );
}
