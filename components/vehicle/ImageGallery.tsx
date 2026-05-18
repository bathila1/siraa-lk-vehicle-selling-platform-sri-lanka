'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
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
  const [lightbox, setLightbox] = useState(false);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center text-gray-300">
        <span className="text-sm">No photos</span>
      </div>
    );
  }

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  return (
    <>
      {/* Main image */}
      <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden group">
        <Image
          src={images[active].url}
          alt={`${title} — photo ${active + 1}`}
          fill
          loading='eager'
          sizes="(max-width: 768px) 100vw, 66vw"
          className="object-cover"
          priority={active === 0}
        />

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter + zoom */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {images.length > 1 && (
            <span className="bg-black/40 text-white text-xs px-2 py-1 rounded-full">
              {active + 1} / {images.length}
            </span>
          )}
          <button
            onClick={() => setLightbox(true)}
            className="bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5"
            aria-label="View full size"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={cn(
                'flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                i === active ? 'border-[var(--brand-green)]' : 'border-transparent hover:border-gray-300',
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

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-2"
            onClick={() => setLightbox(false)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-2"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-2"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <div
            className="relative max-w-4xl max-h-[90vh] w-full mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[active].url}
              alt={`${title} — full size ${active + 1}`}
              width={images[active].width ?? 1200}
              height={images[active].height ?? 900}
              className="object-contain max-h-[90vh] w-full"
            />
          </div>
        </div>
      )}
    </>
  );
}
