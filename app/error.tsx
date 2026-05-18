'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[error.tsx]', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-[var(--brand-bg)]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[var(--color-border)] p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-lg font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-6">
          We hit an unexpected error. Please try again, or head back home.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-[var(--brand-green)] hover:bg-[var(--brand-deep)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[var(--brand-green)] px-4 py-2"
          >
            Go Home
          </Link>
        </div>
        {error.digest && (
          <p className="text-[10px] text-gray-300 mt-6 font-mono">{error.digest}</p>
        )}
      </div>
    </main>
  );
}
