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
    .select(
      `
      id, year, model, slug,
      vehicle_makes ( name )
    `,
    )
    .eq('id', id)
    .single();

  if (!vehicle) notFound();

  const v = vehicle as any;
  const title = `${v.year} ${v.vehicle_makes?.name} ${v.model}`;

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center bg-[var(--brand-bg)] px-4 py-8">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h1 className="mb-1 text-lg font-bold">Report this ad</h1>
          <p className="mb-5 text-xs text-gray-500">{title}</p>
          <ReportForm vehicleId={v.id} vehicleSlug={v.slug} />
        </div>
      </main>
    </>
  );
}
