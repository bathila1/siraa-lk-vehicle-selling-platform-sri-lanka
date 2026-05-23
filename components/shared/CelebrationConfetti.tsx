'use client';

import { useEffect, useState } from 'react';

import { Confetti } from '@/components/shared/Confetti';

interface Props {
  /** If truthy (e.g. the slug from ?posted=), fires confetti once on mount */
  trigger?: string | null;
}

/**
 * Client wrapper that fires confetti on mount if a trigger is present.
 *
 * Use on the dashboard when ?posted=<slug> is in the URL — happens after
 * a successful ad post. Also used after marking sold, boost confirmation, etc.
 *
 * Only fires once per page load to avoid spam on re-renders.
 */
export function CelebrationConfetti({ trigger }: Props) {
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (trigger && !fired) {
      // Small delay so the page paint settles first
      const t = setTimeout(() => setFired(true), 150);
      return () => clearTimeout(t);
    }
  }, [trigger, fired]);

  return <Confetti fire={fired} onComplete={() => {}} />;
}
