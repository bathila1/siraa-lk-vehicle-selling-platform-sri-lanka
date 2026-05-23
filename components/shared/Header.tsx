import Link from 'next/link';
import { Heart, PlusCircle, User, LayoutDashboard } from 'lucide-react';

import { SearchBar } from '@/components/search/SearchBar';
import { getSession } from '@/lib/auth/session';
import { NotificationBell } from '../auth/NotificationBell';

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white shadow-sm">
      <div className="container mx-auto px-4">
        {/* Main row */}
        <div className="flex h-14 items-center gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 text-xl font-bold tracking-tight text-[var(--brand-deep)]"
          >
            Siraa<span className="text-[var(--brand-green)]">.lk</span>
          </Link>

          {/* Desktop search */}
          <div className="hidden max-w-2xl flex-1 md:flex">
            <SearchBar className="w-full" />
          </div>

          {/* Nav actions */}
          <nav className="ml-auto flex items-center gap-1">
            {/* Saved */}
            <Link
              href="/saved"
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-[var(--brand-green)] sm:px-3"
              aria-label="Saved"
            >
              <Heart className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">Saved</span>
            </Link>

            {/* Notification bell (logged in only) */}
            {session && <NotificationBell />}

            {/* MY ADS — outlined (secondary) */}
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden items-center gap-2 rounded-xl border-2 border-[var(--brand-green)] bg-white px-3 py-[7px] text-sm font-semibold text-[var(--brand-green)] transition-all duration-200 hover:bg-[var(--brand-green)] hover:text-white active:scale-95 sm:inline-flex sm:px-4"
                  aria-label="My Ads Dashboard"
                >
                  <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                  <span>My Ads</span>
                </Link>
                {/* Post Free — solid primary */}
                <Link
                  href="/post-ad"
                  className="items-center gap-1.5 rounded-xl border-2 border-[var(--brand-green)] bg-[var(--brand-green)] px-3 py-[7px] text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,160,80,0.25)] transition-all duration-200 hover:border-[var(--brand-deep)] hover:bg-[var(--brand-deep)] hover:shadow-[0_4px_16px_rgba(0,80,40,0.3)] active:scale-95 sm:inline-flex sm:px-4"
                >
                  <PlusCircle className="hidden h-4 w-4 flex-shrink-0 sm:inline" />
                  <span>Post Free</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-[var(--brand-green)] sm:inline-flex"
                >
                  Sign In
                </Link>
                {/* Post Free — solid primary */}
                <Link
                  href="/post-ad"
                  className="items-center gap-1.5 rounded-xl border-2 border-[var(--brand-green)] bg-[var(--brand-green)] px-3 py-[7px] text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,160,80,0.25)] transition-all duration-200 hover:border-[var(--brand-deep)] hover:bg-[var(--brand-deep)] hover:shadow-[0_4px_16px_rgba(0,80,40,0.3)] active:scale-95 sm:inline-flex sm:px-4"
                >
                  <PlusCircle className="hidden h-4 w-4 flex-shrink-0 sm:inline" />
                  <span>Post Free</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Mobile search row */}
        <div className="pb-3 md:hidden">
          <SearchBar className="w-full" />
        </div>
      </div>

      {/* Mobile bottom nav bar (logged-in users) */}
      {session && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-gray-100 bg-white px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden"
          aria-label="Mobile navigation"
        >
          <Link
            href="/"
            className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-gray-400 transition-colors hover:text-[var(--brand-green)]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link
            href="/saved"
            className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-gray-400 transition-colors hover:text-[var(--brand-green)]"
          >
            <Heart className="h-5 w-5" />
            <span className="text-[10px] font-medium">Saved</span>
          </Link>

          <Link
            href="/post-ad"
            className="-mt-7 flex flex-col items-center gap-0.5 rounded-2xl bg-[var(--brand-green)] px-3 py-2.5 text-white shadow-lg transition-all hover:bg-[var(--brand-deep)] active:scale-95"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Post Free</span>
          </Link>

          <div className="flex flex-col items-center gap-0.5 text-gray-400">
            {/* <NotificationBell /> */}
            <Link
              href="/dashboard/notifications"
              className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-gray-400 transition-colors hover:text-[var(--brand-green)]"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">Alerts</span>
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[var(--brand-green)] transition-colors hover:bg-[var(--brand-bg)]"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-semibold">My Ads</span>
          </Link>
        </nav>
      )}

      {session && <div className="h-0 md:hidden" id="mobile-nav-spacer" />}
    </header>
  );
}
