import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Header } from '@/components/shared/Header';
import { EditAdForm } from '@/components/auth/EditAdForm';
import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { getVehicleTypes, getDistricts, getVehicleMakesByType } from '@/lib/db/queries';

export const metadata: Metadata = { title: 'Edit Ad' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard');

  const { id } = await params;
  const vehicleId = parseInt(id);
  if (isNaN(vehicleId)) notFound();

  const supabase = createServiceClient();

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .eq('seller_id', session.seller_id)
    .single();

  if (!vehicle) notFound();

  const [vehicleTypes, districts, makes, { data: cities }] = await Promise.all([
    getVehicleTypes(),
    getDistricts(),
    getVehicleMakesByType(),
    supabase.from('cities').select('id, district_id, name_en').order('sort_order'),
  ]);

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3.5rem)] bg-[var(--brand-bg)]">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-xl font-bold mb-4">Edit Ad</h1>
          <EditAdForm
            vehicle={vehicle}
            vehicleTypes={vehicleTypes}
            districts={districts}
            makes={makes}
            cities={cities ?? []}
          />
        </div>
      </main>
    </>
  );
}
