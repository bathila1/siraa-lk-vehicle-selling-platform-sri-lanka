'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  /** The user's search query, used to prefill the request form */
  query?: string;
}

/**
 * Shown on search results when no vehicles match.
 * CTA links to /request with prefilled query for one-click submission.
 */
export function NoResultsRequestCTA({ query }: Props) {
  const href = query ? `/request?q=${encodeURIComponent(query)}` : '/request';

  return (
    <div className="rounded-2xl border-2 border-dashed border-[var(--brand-green)] bg-gradient-to-br from-[var(--brand-bg)] to-white p-2 text-center mb-0 mt-0">

      <h3 className="mb-2 text-lg font-bold text-[var(--brand-deep)]">
        ඔබ සොයන වාහනය සමුවූයේ නැති ද?
      </h3>
      <p className="mb-1 text-sm text-gray-600">
        අපි ඔබට සොයා දෙන්නම්. Request එකක් දමන්න
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-green)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--brand-deep)] hover:shadow-md active:scale-95"
      >
        <Sparkles className="w-4 h-4 text-amber-200" />
        <span>Request Vehicle</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
