'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Smart scroll reset for client-side navigation.
 *
 * - Fresh navigation (clicking a link/card → PUSH): scrolls to top.
 * - Back/forward button (POP): does nothing, so the browser restores
 *   the previous scroll position (e.g. returning to search results
 *   keeps your place in the list).
 *
 * Mount this inside any page you want the behaviour on. It renders
 * nothing. Detection works by listening for `popstate` — when that
 * fires, the very next pathname change is a back/forward and we skip
 * the scroll reset for it.
 */
export function ScrollResetOnNavigate() {
  const pathname = usePathname();
  const isPopRef = useRef(false);
  const isFirstRender = useRef(true);

  // Mark navigations triggered by the back/forward buttons.
  useEffect(() => {
    const onPopState = () => {
      isPopRef.current = true;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // On every pathname change, decide whether to reset scroll.
  useEffect(() => {
    // Skip the very first mount — fresh page loads already start at top,
    // and we don't want to fight the browser's own restoration on reload.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isPopRef.current) {
      // This change came from back/forward — let the browser restore.
      isPopRef.current = false;
      return;
    }

    // Fresh forward navigation — go to top.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}