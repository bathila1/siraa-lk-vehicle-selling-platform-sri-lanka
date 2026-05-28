'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    // Update the sort parameter and reset to page 1
    params.set('sort', value);
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative flex items-center">
      <select
        value={current}
        onChange={handleChange}
        className="h-9 appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-sm font-medium text-gray-700 focus:border-[var(--brand-green)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-green)] cursor-pointer"
      >
        <option value="newest">Sort: Newest</option>
        <option value="price_asc">Sort: Price ↑</option>
        <option value="price_desc">Sort: Price ↓</option>
        <option value="year_desc">Sort: Year ↓</option>
      </select>
      {/* Custom arrow icon to match the filter button style */}
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
    </div>
  );
}