import { cn } from '@/lib/utils';

/**
 * Base skeleton box. Use to compose page-level loading states.
 *
 * The shimmer + colour is defined in globals.css (.skeleton).
 * Pair with width/height utilities to size each piece.
 *
 * Examples:
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton className="h-48 w-full rounded-xl" />
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-md', className)} />;
}

/**
 * Vehicle card skeleton — matches the real VehicleCard layout exactly so
 * the visual swap when content loads feels instant rather than jumpy.
 */
export function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
      {/* Image area */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      {/* Body */}
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
        </div>
        <div className="flex justify-between pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of vehicle card skeletons — matches search results grid.
 */
export function VehicleGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Dashboard list row skeleton — matches the horizontal card layout in /dashboard.
 */
export function DashboardRowSkeleton() {
  return (
    <div className="flex items-stretch gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3">
      <Skeleton className="h-20 w-20 flex-shrink-0 rounded-lg sm:h-24 sm:w-24" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-3 w-24" />
        <div className="mt-auto flex gap-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-9 w-9 flex-shrink-0 rounded-lg" />
    </div>
  );
}

/**
 * Vehicle detail page skeleton.
 */
export function VehicleDetailSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        <div className="mt-2 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-16 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-3 md:col-span-1">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Blog post card skeleton (used in /blog index).
 */
export function BlogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-32 pt-2" />
      </div>
    </div>
  );
}

/**
 * Admin table row skeleton — generic, just renders shimmer cells.
 */
export function TableRowSkeleton({ cells = 5 }: { cells?: number }) {
  return (
    <tr className="border-t border-[var(--color-border)]">
      {Array.from({ length: cells }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <Skeleton className="h-4 w-full max-w-[200px]" />
        </td>
      ))}
    </tr>
  );
}
