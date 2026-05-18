import type { Metadata } from 'next';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Siraa.lk.',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold text-[var(--brand-deep)] mb-2">Terms of Service</h1>
        <p className="text-xs text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
          <p>
            By using Siraa.lk (&quot;the Service&quot;) you agree to these terms. Please read them
            carefully. If you don&apos;t agree, please don&apos;t use the Service.
          </p>

          <Section title="1. The platform">
            <p>
              Siraa is a marketplace platform that connects vehicle buyers and sellers in Sri Lanka.
              We don&apos;t own, inspect, or take possession of the vehicles listed. Each transaction
              is between the buyer and the seller directly.
            </p>
          </Section>

          <Section title="2. Listing rules">
            <p>You may only list vehicles that:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>You own or are legally authorized to sell</li>
              <li>Are accurately described</li>
              <li>Have at least 3 real photos</li>
              <li>Are not duplicates of other listings</li>
            </ul>
            <p className="mt-2">
              We reserve the right to remove any listing at our discretion, especially if reported by buyers.
            </p>
          </Section>

          <Section title="3. Seller responsibilities">
            <ul className="list-disc pl-5 space-y-1">
              <li>Mark vehicles as &quot;sold&quot; promptly after sale</li>
              <li>Respond to legitimate buyer inquiries</li>
              <li>Be honest about vehicle condition</li>
              <li>Follow Sri Lankan vehicle transfer laws when completing sales</li>
            </ul>
          </Section>

          <Section title="4. Buyer responsibilities">
            <ul className="list-disc pl-5 space-y-1">
              <li>Inspect the vehicle physically before purchasing</li>
              <li>Verify ownership documents independently</li>
              <li>Use safe meeting locations</li>
            </ul>
          </Section>

          <Section title="5. Boosts &amp; payments">
            <p>
              Optional paid features (NormalBoost, BoostPro) are non-refundable once activated.
              All payments are processed via PayHere. If a boost fails to deliver due to our error,
              we&apos;ll extend or refund it.
            </p>
          </Section>

          <Section title="6. Prohibited content">
            <p>Listings must not:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Be fraudulent, misleading, or illegal</li>
              <li>Promote stolen vehicles</li>
              <li>Contain hate speech or discriminatory content</li>
              <li>Solicit anything other than the vehicle itself</li>
            </ul>
          </Section>

          <Section title="7. Liability">
            <p>
              Siraa.lk is not liable for: the condition or legality of listed vehicles, transactions
              between users, disputes between buyers and sellers, or losses arising from use of the
              Service. Use the platform at your own risk.
            </p>
          </Section>

          <Section title="8. Account suspension">
            <p>
              We may suspend or ban accounts that violate these terms, including patterns of fake listings,
              scams, or repeated reports from users.
            </p>
          </Section>

          <Section title="9. Changes">
            <p>
              We may update these terms. Continued use after changes constitutes acceptance.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Questions about these terms? Email{' '}
              <a href="mailto:hello@siraa.lk" className="text-[var(--brand-green)] hover:underline">
                hello@siraa.lk
              </a>.
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-[var(--brand-deep)] mb-2">{title}</h2>
      <div className="text-sm text-gray-700">{children}</div>
    </section>
  );
}
