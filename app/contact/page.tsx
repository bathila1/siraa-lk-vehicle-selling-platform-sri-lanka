import type { Metadata } from 'next';
import { Mail, Phone, MessageCircle } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Siraa.lk team.',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-xl">
        <h1 className="text-3xl font-bold text-[var(--brand-deep)] mb-2">Contact Us</h1>
        <p className="text-sm text-gray-500 mb-8">We&apos;d love to hear from you.</p>

        <div className="space-y-3">
          <a
            href="mailto:hello@siraa.lk"
            className="flex items-center gap-3 bg-white border border-[var(--color-border)] hover:border-[var(--brand-green)] rounded-xl p-4 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--brand-bg)] flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-[var(--brand-deep)]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium">hello@siraa.lk</p>
            </div>
          </a>

          <a
            href="tel:+94764790033"
            className="flex items-center gap-3 bg-white border border-[var(--color-border)] hover:border-[var(--brand-green)] rounded-xl p-4 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--brand-bg)] flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-[var(--brand-deep)]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium">+94 76 479 0033</p>
            </div>
          </a>

          <a
            href="https://wa.me/94764790033"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white border border-[var(--color-border)] hover:border-[var(--brand-green)] rounded-xl p-4 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366]/15 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">WhatsApp</p>
              <p className="text-sm font-medium">+94 76 479 0033</p>
            </div>
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-6 leading-relaxed">
          For ad disputes or report issues, please use the &quot;Report this ad&quot; link on the vehicle page —
          we&apos;ll respond faster that way.
        </p>
      </main>
      <Footer />
    </>
  );
}
