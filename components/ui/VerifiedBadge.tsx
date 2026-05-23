import { ShieldCheck, BadgeCheck, Phone } from 'lucide-react';

import { cn } from '@/lib/utils';

type BadgeTier = 'trusted' | 'verified' | 'unverified';

interface Props {
  /**
   * The verification tier:
   *  - 'trusted'    = admin manually marked as trusted (highest)
   *  - 'verified'   = phone-OTP verified (automatic after signup)
   *  - 'unverified' = no badge shown
   */
  tier: BadgeTier;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether to show the text label, or just the icon */
  showLabel?: boolean;
  className?: string;
}

/**
 * Trust badge shown next to seller names.
 *
 * Two real tiers (third is "no badge"):
 *
 * 1. TRUSTED (blue badge) — manually verified by admin.
 *    Highest trust. Reserved for dealers, repeat sellers, NIC-verified users.
 *
 * 2. VERIFIED (green check) — phone-OTP verified (everyone gets this on signup).
 *    Means "we sent SMS to this number". Doesn't prove identity.
 *
 * 3. (no badge) — banned or anomalous accounts.
 *
 * Hide the badge entirely for tier='unverified' so we don't show distrust.
 */
export function   VerifiedBadge({
  tier,
  size = 'sm',
  showLabel = false,
  className,
}: Props) {
  if (tier === 'unverified') return null;

  const sm = size === 'sm';

  if (tier === 'trusted') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-blue-50 font-medium text-blue-700',
          sm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
          className,
        )}
        title="Trusted Seller — manually verified by Siraa.lk"
      >
        <BadgeCheck className={cn(sm ? 'h-3 w-3' : 'h-3.5 w-3.5', 'fill-blue-500 text-white')} />
        {showLabel && <span>Trusted</span>}
      </span>
    );
  }

  // verified — phone-OTP only
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[var(--brand-green)]',
        sm ? 'text-[10px]' : 'text-xs',
        className,
      )}
      title="Phone Verified — SMS confirmed by Siraa.lk"
    >
      <ShieldCheck className={sm ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {showLabel && <span>Verified</span>}
    </span>
  );
}

/**
 * Derive the trust tier from raw seller data.
 * Use this in server components to avoid leaking dates to client.
 */
export function getTrustTier(seller: {
  trusted_at?: string | null;
  verified_at?: string | null;
  banned_at?: string | null;
}): BadgeTier {
  if (seller.banned_at) return 'unverified';
  if (seller.trusted_at) return 'trusted';
  if (seller.verified_at) return 'verified';
  return 'unverified';
}
