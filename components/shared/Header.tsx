import Link from 'next/link';
import { Heart, PlusCircle, User } from 'lucide-react';

import { SearchBar } from '@/components/search/SearchBar';
import { getSession } from '@/lib/auth/session';
import { NotificationBell } from '../auth/NotificationBell';

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center gap-3">
          <Link
            href="/"
            className="flex-shrink-0 text-xl font-bold tracking-tight text-[var(--brand-deep)]"
          >
            Siraa<span className="text-[var(--brand-green)]">.lk</span>
          </Link>

          <div className="hidden max-w-2xl flex-1 md:flex">
            <SearchBar className="w-full" />
          </div>

          <nav className="ml-auto flex items-center gap-1">
            <Link
              href="/saved"
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-[var(--brand-green)] sm:px-3"
              aria-label="Saved"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
            </Link>
            {session && (
  <>
    <NotificationBell />
    {/* existing My Ads / Dashboard links */}
  </>
)}

            {session ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-[var(--brand-green)] sm:px-3"
                aria-label="Dashboard"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">My Ads</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-lg px-2 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-[var(--brand-green)] sm:inline-flex sm:px-3"
              >
                Sign In
              </Link>
            )}

            <Link
              href="/post-ad"
              className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-green)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-deep)] sm:px-4"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Post Free</span>
            </Link>
          </nav>
        </div>

        <div className="pb-3 md:hidden">
          <SearchBar className="w-full" />
        </div>
      </div>
    </header>
  );
}
