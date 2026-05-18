import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Header } from '@/components/shared/Header';
import { ReportForm } from '@/components/auth/ReportForm';
import { createServiceClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Report an Ad' };

interface Props {
  params: Promise<{ vehicleId: string }>;
}

export default async function ReportPage({ params }: Props) {
  const { vehicleId } = await params;
  const id = parseInt(vehicleId);
  if (isNaN(id)) notFound();

  // Look up vehicle for context
  const supabase = createServiceClient();
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select(`
      id, year, model, slug,
      vehicle_makes ( name )
    `)
    .eq('id', id)
    .single();

  if (!vehicle) notFound();

  const v = vehicle as any;
  const title = `${v.year} ${v.vehicle_makes?.name} ${v.model}`;

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center px-4 py-8 bg-[var(--brand-bg)]">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-[var(--color-border)] p-6">
          <h1 className="text-lg font-bold mb-1">Report this ad</h1>
          <p className="text-xs text-gray-500 mb-5">{title}</p>
          <ReportForm vehicleId={v.id} vehicleSlug={v.slug} />
        </div>
      </main>
    </>
  );
}
