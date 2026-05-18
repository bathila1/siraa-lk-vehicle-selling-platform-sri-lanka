import Link from 'next/link';
import { Heart, PlusCircle, User } from 'lucide-react';

import { SearchBar } from '@/components/search/SearchBar';
import { getSession } from '@/lib/auth/session';

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 h-14">
          <Link href="/" className="flex-shrink-0 font-bold text-xl text-[var(--brand-deep)] tracking-tight">
            Siraa<span className="text-[var(--brand-green)]">.lk</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchBar className="w-full" />
          </div>

          <nav className="flex items-center gap-1 ml-auto">
            <Link
              href="/saved"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[var(--brand-green)] px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Saved"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Saved</span>
            </Link>

            {session ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[var(--brand-green)] px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Dashboard"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">My Ads</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-[var(--brand-green)] px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors hidden sm:inline-flex"
              >
                Sign In
              </Link>
            )}

            <Link
              href="/post-ad"
              className="flex items-center gap-1.5 text-sm font-medium bg-[var(--brand-green)] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[var(--brand-deep)] transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Ad</span>
            </Link>
          </nav>
        </div>

        <div className="md:hidden pb-3">
          <SearchBar className="w-full" />
        </div>
      </div>
    </header>
  );
}
