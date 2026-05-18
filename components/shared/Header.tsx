import Link from 'next/link';
import { Search, Heart, PlusCircle } from 'lucide-react';

import { SearchBar } from '@/components/search/SearchBar';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top row */}
        <div className="flex items-center gap-4 h-14">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 font-bold text-xl text-[var(--brand-deep)] tracking-tight">
            Siraa<span className="text-[var(--brand-green)]">.lk</span>
          </Link>

          {/* Search bar — hidden on mobile, shown md+ */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchBar className="w-full" />
          </div>

          {/* Nav actions */}
          <nav className="flex items-center gap-1 ml-auto">
            <Link
              href="/saved"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[var(--brand-green)] px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Saved</span>
            </Link>
            <Link
              href="/post-ad"
              className="flex items-center gap-1.5 text-sm font-medium bg-[var(--brand-green)] text-white px-4 py-2 rounded-lg hover:bg-[var(--brand-deep)] transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Ad</span>
            </Link>
          </nav>
        </div>

        {/* Mobile search row */}
        <div className="md:hidden pb-3">
          <SearchBar className="w-full" />
        </div>
      </div>
    </header>
  );
}
