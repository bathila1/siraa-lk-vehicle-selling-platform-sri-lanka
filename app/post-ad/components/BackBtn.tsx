'use client';

import { useRouter } from 'next/navigation';

export default function BackBtn() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="items-center gap-2 rounded-xl border-2 border-[var(--brand-green)] bg-white px-2 py-[3px] text-sm font-semibold text-[var(--brand-green)] transition-all duration-200 hover:bg-[var(--brand-green)] hover:text-white active:scale-95 sm:inline-flex sm:px-4"
      aria-label="Go Back"
    >
      <span>Back</span>
    </button>
  );
}