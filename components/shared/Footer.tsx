import Link from 'next/link';
import { Heart } from 'lucide-react';
import Image from 'next/image';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-[var(--color-border)] bg-white">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="mb-2 block text-lg font-bold text-[var(--brand-deep)]">
              Siraa<span className="text-[var(--brand-green)]">.lk</span>
            </Link>
            <p className="mb-3 max-w-xs text-xs leading-relaxed text-gray-500">
              Sri Lanka&apos;s vehicle marketplace. Fast, fair, mobile-first.
            </p>
            <p className="lang-si flex items-center gap-1.5 text-[11px] text-gray-400">
              <Image
                src="/sri-lanka.png"
                alt="Sri Lanka"
                width={12}
                height={8}
                style={{ width: 'auto', height: 'auto' }}
                className="h-auto w-3 opacity-70"
              />
              අභිමානවත් ශ්‍රී ලාංකීය නිර්මාණයකි
            </p>
          </div>

          {/* Browse */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-700">
              Browse
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-gray-500 hover:text-[var(--brand-green)]">
                  All Vehicles
                </Link>
              </li>
              <li>
                <Link
                  href="/search?vehicleTypeId=1"
                  className="text-gray-500 hover:text-[var(--brand-green)]"
                >
                  Cars
                </Link>
              </li>
              <li>
                <Link
                  href="/search?vehicleTypeId=4"
                  className="text-gray-500 hover:text-[var(--brand-green)]"
                >
                  Motorcycles
                </Link>
              </li>
              <li>
                <Link href="/post-ad" className="text-gray-500 hover:text-[var(--brand-green)]">
                  Post Ad
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-700">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-500 hover:text-[var(--brand-green)]">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-500 hover:text-[var(--brand-green)]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-500 hover:text-[var(--brand-green)]">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-500 hover:text-[var(--brand-green)]">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-500 hover:text-[var(--brand-green)]">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5 text-xs text-gray-400 md:flex-row">
          <p>© {year} Siraa.lk · All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 fill-red-400 text-red-400" /> in Sri Lanka
          </p>
        </div>
      </div>
    </footer>
  );
}
