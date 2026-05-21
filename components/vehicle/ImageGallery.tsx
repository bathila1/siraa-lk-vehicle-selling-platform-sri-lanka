'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

import { ImageZoomModal } from './ImageZoomModal';
import { cn } from '@/lib/utils';

interface GalleryImage {
  url: string;
  is_primary: boolean;
  sort_order: number;
  width: number | null;
  height: number | null;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gray-100 text-gray-300">
        <span className="text-sm">No photos</span>
      </div>
    );
  }

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  return (
    <>
      {/* Main image */}
      <div className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="absolute inset-0 z-10 cursor-zoom-in"
          aria-label="View full size"
        />

        <Image
          src={images[active].url}
          alt={`${title} — photo ${active + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 66vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          priority={active === 0}
        />

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Counter + zoom indicator */}
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-2">
          {images.length > 1 && (
            <span className="rounded-full bg-black/40 px-2 py-1 text-xs text-white">
              {active + 1} / {images.length}
            </span>
          )}
          <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs text-white">
            <ZoomIn className="h-3 w-3" />
            Tap to zoom
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                i === active
                  ? 'border-[var(--brand-green)]'
                  : 'border-transparent hover:border-gray-300',
              )}
            >
              <Image
                src={img.url}
                alt={`Thumbnail ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom modal */}
      <ImageZoomModal
        images={images}
        initialIndex={active}
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
      />
    </>
  );
}
