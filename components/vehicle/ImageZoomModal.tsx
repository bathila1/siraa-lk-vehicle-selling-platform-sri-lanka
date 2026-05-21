'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  images: { url: string }[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

/**
 * Fullscreen image lightbox with:
 * - Keyboard nav (←/→ to navigate, Esc to close, +/- to zoom)
 * - Click-to-zoom + pan on zoomed image
 * - Mobile pinch-to-zoom via touch-action: pinch-zoom
 * - Body scroll lock while open
 */
export function ImageZoomModal({ images, initialIndex, open, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  // Keep state in sync when reopened
  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setZoom(1);
      setOrigin({ x: 50, y: 50 });
    }
  }, [open, initialIndex]);

  // Body scroll lock + keyboard nav
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.5, 3));
      if (e.key === '-') setZoom((z) => Math.max(z - 0.5, 1));
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const next = () => {
    setIndex((i) => (i + 1) % images.length);
    setZoom(1);
  };
  const prev = () => {
    setIndex((i) => (i - 1 + images.length) % images.length);
    setZoom(1);
  };

  // Track mouse position inside the image for hotspot zoom
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom === 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
  };

  const toggleZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom === 1) {
      // Zoom in centered on click position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setOrigin({ x, y });
      setZoom(2);
    } else {
      setZoom(1);
      setOrigin({ x: 50, y: 50 });
    }
  };

  if (!open || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      <div className="absolute left-3 top-3 z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-md">
        {index + 1} / {images.length}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(z - 0.5, 1));
          }}
          disabled={zoom <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white backdrop-blur-md">
          {Math.round(zoom * 100)}%
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(z + 0.5, 3));
          }}
          disabled={zoom >= 3}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 md:left-6"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 md:right-6"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          toggleZoom(e);
        }}
        onMouseMove={onMouseMove}
        className="relative flex h-full w-full max-w-6xl items-center justify-center overflow-hidden"
        style={{ cursor: zoom === 1 ? 'zoom-in' : 'zoom-out' }}
      >
        <img
          src={images[index].url}
          alt={`Photo ${index + 1}`}
          className="max-h-[88vh] max-w-[92vw] select-none object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: `${origin.x}% ${origin.y}%`,
            touchAction: 'pinch-zoom',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
