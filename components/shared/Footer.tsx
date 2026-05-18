import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[var(--color-border)] mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="font-bold text-lg text-[var(--brand-deep)] mb-2 block">
              Siraa<span className="text-[var(--brand-green)]">.lk</span>
            </Link>
            <p className="text-xs text-gray-500 mb-3 max-w-xs leading-relaxed">
              Sri Lanka&apos;s vehicle marketplace. Fast, fair, mobile-first.
            </p>
            <p className="text-[11px] text-gray-400 lang-si">
              අභිමානවත් ශ්‍රී ලාංකීය නිර්මාණයකි
            </p>
          </div>

          {/* Browse */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Browse</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/search" className="text-gray-500 hover:text-[var(--brand-green)]">All Vehicles</Link></li>
              <li><Link href="/search?vehicleTypeId=1" className="text-gray-500 hover:text-[var(--brand-green)]">Cars</Link></li>
              <li><Link href="/search?vehicleTypeId=4" className="text-gray-500 hover:text-[var(--brand-green)]">Motorcycles</Link></li>
              <li><Link href="/post-ad" className="text-gray-500 hover:text-[var(--brand-green)]">Post Ad</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-gray-500 hover:text-[var(--brand-green)]">About</Link></li>
              <li><Link href="/contact" className="text-gray-500 hover:text-[var(--brand-green)]">Contact</Link></li>
              <li><Link href="/blog" className="text-gray-500 hover:text-[var(--brand-green)]">Blog</Link></li>
              <li><Link href="/terms" className="text-gray-500 hover:text-[var(--brand-green)]">Terms</Link></li>
              <li><Link href="/privacy" className="text-gray-500 hover:text-[var(--brand-green)]">Privacy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] mt-8 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {year} Siraa.lk · All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> in Sri Lanka
          </p>
        </div>
      </div>
    </footer>
  );
}
