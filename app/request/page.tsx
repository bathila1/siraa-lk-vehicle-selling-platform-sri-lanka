import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Sparkles, Clock, Shield } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { VehicleRequestForm } from '@/components/request/VehicleRequestForm';
import { createServiceClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Request a Vehicle — We Find It for You',
  description: "Can't find what you're looking for? Tell us what vehicle you need and we'll search Sri Lanka's market on your behalf. Free, no obligation.",
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function VehicleRequestPage({ searchParams }: Props) {
  const { q } = await searchParams;

  const supabase = createServiceClient();
  const [{ data: vehicleTypes }, { data: districts }] = await Promise.all([
    supabase
      .from('vehicle_types')
      .select('id, name_en, name_si, slug, sort_order')
      .eq('active', true)
      .order('sort_order'),
    supabase
      .from('districts')
      .select('id, name_en')
      .order('sort_order'),
  ]);

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        {/* Hero */}
        <section className="mb-8 text-center">
          <h1 className="text-1xl font-bold text-[var(--brand-deep)] md:text-2xl">
            ඔබට අවශ්‍ය වාහනය අපිට කියන්න. අප සොයා දෙන්නම්.
          </h1>

          {/* Trust strip */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[var(--brand-green)]" />
              ~24h response
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--brand-green)]" />
              100% Free service
            </span>
          </div>
        </section>

        <Suspense>
          <VehicleRequestForm
            vehicleTypes={vehicleTypes ?? []}
            districts={districts ?? []}
            prefillQuery={q ?? ''}
          />
        </Suspense>

        {/* FAQ */}
        <section className="mt-12 space-y-4 text-sm">
          <h2 className="text-base font-semibold text-[var(--brand-black)]">
            How does this work?
          </h2>
          <FAQItem
            q="What happens after I submit?"
            a="An admin reviews your request, searches our listings, our network of dealers, and the web to find matches. You'll be contacted on WhatsApp or by call (your choice) usually within 24 hours."
          />
          <FAQItem
            q="Is this free?"
            a="Yes, completely free. We don't charge customers — we only earn from sellers who buy boost upgrades for their ads."
          />
          <FAQItem
            q="What if I change my mind?"
            a="No problem. There's no obligation. Just let us know when we contact you."
          />
          <FAQItem
            q="How do you protect my information?"
            a="Your phone number is shared only with verified sellers when we have a confirmed match. We never sell or share your data with advertisers."
          />
        </section>
      </main>
      <Footer />
    </>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-[var(--color-border)] bg-white p-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between font-medium text-[var(--brand-black)]">
        {q}
        <svg
          className="h-4 w-4 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{a}</p>
    </details>
  );
}
