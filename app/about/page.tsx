import type { Metadata } from 'next';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'About Siraa.lk — Sri Lanka\'s vehicle marketplace built for buyers and sellers across the island.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold text-[var(--brand-deep)] mb-2">About Siraa.lk</h1>
        <p className="text-sm text-gray-500 mb-8 lang-si">අභිමානවත් ශ්‍රී ලාංකීය නිර්මාණයකි</p>

        <div className="prose prose-sm max-w-none space-y-5 text-gray-700 leading-relaxed">
          <p>
            Siraa is Sri Lanka&apos;s modern vehicle marketplace, built for individual sellers and
            buyers who want a fast, fair, mobile-first way to trade vehicles.
          </p>
          <p>
            We focus on registered vehicles sold by their owners. Every seller verifies their phone
            via SMS, so what you see is real people with real vehicles.
          </p>
          <h2 className="text-lg font-semibold text-[var(--brand-deep)] pt-4">Our mission</h2>
          <p>
            To make buying and selling vehicles in Sri Lanka as simple as sending a WhatsApp message —
            with no fake listings, no middlemen, and no hidden fees.
          </p>
          <h2 className="text-lg font-semibold text-[var(--brand-deep)] pt-4">Built locally</h2>
          <p>
            Siraa is designed and built in Sri Lanka, with our users in mind. Singlish UI, Sri Lankan
            districts and cities, LKR pricing, local payment methods, and direct WhatsApp/call contact —
            because that&apos;s how things actually work here.
          </p>
          <h2 className="text-lg font-semibold text-[var(--brand-deep)] pt-4">Contact us</h2>
          <p>
            Have feedback or a question? Email{' '}
            <a href="mailto:hello@siraa.lk" className="text-[var(--brand-green)] hover:underline">
              hello@siraa.lk
            </a>{' '}
            or reach out via our{' '}
            <a href="/contact" className="text-[var(--brand-green)] hover:underline">
              contact page
            </a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
