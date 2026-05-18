import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Sinhala } from 'next/font/google';

import '@/styles/globals.css';
import { JsonLd, organizationSchema, websiteSchema } from '@/components/shared/JsonLd';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const notoSinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  display: 'swap',
  variable: '--font-sinhala',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Siraa.lk — Sri Lanka\'s Vehicle Marketplace',
    template: '%s | Siraa.lk',
  },
  description:
    "Sri Lanka's premium vehicle marketplace. Buy and sell registered cars, vans, SUVs, motorcycles and more — fast, simple, trusted.",
  keywords: [
    'vehicles sri lanka',
    'cars for sale sri lanka',
    'used cars sri lanka',
    'motorcycles sri lanka',
    'siraa',
    'siraa.lk',
    'vehicle marketplace',
  ],
  authors: [{ name: 'Siraa.lk' }],
  creator: 'Siraa.lk',
  publisher: 'Siraa.lk',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_LK',
    url: SITE_URL,
    siteName: 'Siraa.lk',
    title: "Siraa.lk — Sri Lanka's Vehicle Marketplace",
    description:
      'Buy and sell vehicles in Sri Lanka — fast, simple, mobile-first. අභිමානවත් ශ්‍රී ලාංකීය නිර්මාණයකි.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Siraa.lk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Siraa.lk — Sri Lanka's Vehicle Marketplace",
    description: 'Buy and sell vehicles in Sri Lanka — fast, simple, mobile-first.',
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: SITE_URL },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#2FA084',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSinhala.variable}`}>
      <body>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        {children}
      </body>
    </html>
  );
}
