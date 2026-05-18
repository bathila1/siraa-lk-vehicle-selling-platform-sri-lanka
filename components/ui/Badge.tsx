import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'boost' | 'pro' | 'price-drop' | 'new' | 'default';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
        variant === 'boost' && 'bg-[var(--brand-green)] text-white',
        variant === 'pro' && 'bg-amber-500 text-white',
        variant === 'price-drop' && 'bg-red-500 text-white',
        variant === 'new' && 'bg-[var(--brand-mint)] text-[var(--brand-deep)]',
        variant === 'default' && 'bg-gray-100 text-gray-700',
        className,
      )}
    >
      {children}
    </span>
  );
}
