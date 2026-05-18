import type { Metadata } from 'next';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Siraa.lk collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold text-[var(--brand-deep)] mb-2">Privacy Policy</h1>
        <p className="text-xs text-gray-500 mb-8">
          Last updated: {new Date().toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
          <p>We take your privacy seriously. This policy explains what data we collect and why.</p>

          <Section title="What we collect">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Phone number</strong> — required to verify sellers and contact buyers</li>
              <li><strong>Name</strong> — shown on your listings</li>
              <li><strong>District / city</strong> — to help buyers find local vehicles</li>
              <li><strong>Listing details</strong> — make, model, photos, description, price, location pin</li>
              <li><strong>Usage data</strong> — anonymous page views via Google Analytics</li>
              <li><strong>IP addresses</strong> — for rate limiting and fraud prevention only</li>
            </ul>
          </Section>

          <Section title="What we don't collect">
            <ul className="list-disc pl-5 space-y-1">
              <li>Email addresses (we use phone-only auth)</li>
              <li>Government IDs (NIC, passport)</li>
              <li>Credit card details (handled entirely by PayHere)</li>
              <li>Browsing history outside Siraa.lk</li>
            </ul>
          </Section>

          <Section title="How we use your data">
            <ul className="list-disc pl-5 space-y-1">
              <li>To verify you as a real seller</li>
              <li>To display your listings to buyers</li>
              <li>To enable buyer–seller contact via WhatsApp or call</li>
              <li>To improve the platform (aggregate analytics only)</li>
              <li>To prevent fraud and abuse</li>
            </ul>
          </Section>

          <Section title="What we share">
            <p>We don&apos;t sell your data. We share information only with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Buyers</strong> — your name, phone, and listings (publicly visible)</li>
              <li><strong>SMSLenz</strong> — phone number, to send OTP codes</li>
              <li><strong>PayHere</strong> — name and phone, for payment processing</li>
              <li><strong>Cloudflare</strong> — uploaded images, for storage</li>
              <li><strong>Supabase</strong> — all listing data, for our database</li>
              <li><strong>Law enforcement</strong> — only when required by Sri Lankan law</li>
            </ul>
          </Section>

          <Section title="Location data">
            <p>
              When you pin a location on the map for your ad, we store the exact GPS coordinates.
              <strong> Buyers see only a ~500m radius circle</strong>, not your exact spot. We do this
              to protect your privacy while still letting buyers know which neighbourhood the vehicle is in.
            </p>
          </Section>

          <Section title="Image metadata">
            <p>
              When you upload photos, we automatically strip EXIF data (camera model, GPS coordinates
              embedded in the file) before storing them. We do this for your safety.
            </p>
          </Section>

          <Section title="Data retention">
            <p>
              We keep your listings as long as your account is active. You can delete any listing at any time
              from your dashboard. If you want to delete your entire account, email us at{' '}
              <a href="mailto:hello@siraa.lk" className="text-[var(--brand-green)] hover:underline">
                hello@siraa.lk
              </a>{' '}
              and we&apos;ll remove your data within 30 days.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              We use functional cookies for sign-in (session cookies) and Google Analytics for anonymous usage
              statistics. We don&apos;t use advertising cookies or third-party trackers.
            </p>
          </Section>

          <Section title="Your rights">
            <p>You can at any time:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Edit or delete your listings</li>
              <li>Update your profile information</li>
              <li>Sign out from any device</li>
              <li>Request a copy of your data</li>
              <li>Request account deletion</li>
            </ul>
          </Section>

          <Section title="Children">
            <p>Siraa is not intended for users under 18. If you are under 18, please don&apos;t use the platform.</p>
          </Section>

          <Section title="Contact">
            <p>
              Questions or concerns? Email{' '}
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
