import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** A Lucide icon component, or an emoji string. */
  icon?: LucideIcon | string;
  title: string;
  description?: string;
  /** Action button text. If omitted, no button shows. */
  actionLabel?: string;
  /** Where the button goes — link only (use onClick for custom). */
  actionHref?: string;
  /** Or pass a custom click handler instead of href. */
  onAction?: () => void;
  /** Secondary subtle action (e.g. "Skip", "Maybe later") */
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
}

/**
 * Empty state — replace generic "no items" prose with a clear action.
 *
 * Three sizes from props:
 *   - Default: prominent CTA, ideal for first-time empty (e.g. dashboard)
 *   - With both action + secondary: balanced (e.g. search no results)
 *   - Bare (no actions): used inside lists where context is already clear
 *
 * The icon can be:
 *   - A Lucide component: <EmptyState icon={Car} ... />
 *   - An emoji string:     <EmptyState icon="🚗" ... />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-16 text-center', className)}>
      {Icon && (
        <div className="mb-4">
          {typeof Icon === 'string' ? (
            <span className="text-5xl opacity-40" aria-hidden>
              {Icon}
            </span>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-bg)]">
              <Icon className="h-7 w-7 text-[var(--brand-green)]" />
            </div>
          )}
        </div>
      )}

      <h3 className="mb-1 text-base font-semibold text-[var(--brand-black)] md:text-lg">{title}</h3>
      {description && (
        <p className="mb-5 max-w-md text-sm text-gray-500">{description}</p>
      )}

      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          {actionLabel &&
            (actionHref ? (
              <Link
                href={actionHref}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-green)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-deep)] transition-colors"
              >
                {actionLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-green)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-deep)] transition-colors"
              >
                {actionLabel}
              </button>
            ))}
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="text-sm text-gray-500 hover:text-[var(--brand-green)] hover:underline"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
