'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  videoId: string;
  title?: string;
  className?: string;
  /** Aspect ratio class; defaults to 16:9 */
  aspectClass?: string;
}

/**
 * Lazy YouTube embed.
 * - Shows the YouTube thumbnail image (super lightweight, ~20KB)
 * - Iframe loads only when user clicks Play
 * - Prevents the 500KB+ YouTube embed JS from blocking page load
 *
 * Use the videoId from the URL: youtube.com/watch?v=VIDEOID
 */
export function YouTubeLazy({
  videoId,
  title = 'Video',
  className,
  aspectClass = 'aspect-video',
}: Props) {
  const [activated, setActivated] = useState(false);

  // Use the high-quality thumbnail from YouTube's CDN
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-black shadow-lg', aspectClass, className)}>
      {activated ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActivated(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label={`Play ${title}`}
        >
          {/* Thumbnail */}
          <img
            src={thumbnail}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* Dark overlay for contrast */}
          <span className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/10" />
          {/* Play button */}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110 md:h-20 md:w-20">
              <Play className="ml-1 h-7 w-7 fill-[var(--brand-deep)] text-[var(--brand-deep)] md:h-9 md:w-9" />
            </span>
          </span>
          {/* Title overlay */}
          {title && (
            <span className="absolute bottom-3 left-3 right-3 text-left text-xs font-medium text-white drop-shadow-md md:text-sm">
              {title}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
