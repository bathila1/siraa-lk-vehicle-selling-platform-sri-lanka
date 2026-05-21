'use client';

import { useEffect, useRef } from 'react';

interface LocationMapProps {
  lat: number;
  lng: number;
  label: string;
}

export function LocationMap({ lat, lng, label }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    if (!containerRef.current) return;
    const container = containerRef.current;

    let cancelled = false;

    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      if (cancelled) return;

      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Defensive: wipe any leftover Leaflet state on the container
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
        container.innerHTML = '';
      }

      const map = L.map(container, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      L.circle([lat, lng], {
        radius: 500,
        color: '#2FA084',
        fillColor: '#6FCF97',
        fillOpacity: 0.25,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(`<strong>${label}</strong><br>Approximate location`)
        .openPopup();

      mapInstanceRef.current = map;
    };

    loadMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      initStartedRef.current = false;
    };
  }, [lat, lng, label]);
  return (
    <>
      {/* Direction buttons */}
      <div className="mb-3 grid grid-cols-1 gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-green)] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-deep)]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
          </svg>
          Google Maps - Directions
        </a>
      </div>
<a
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div
        ref={containerRef}
        className="h-52 w-full overflow-hidden rounded-xl border border-[var(--color-border)]"
        aria-label={`Map showing approximate location in ${label}`}
      />
      </a>

      <p className="mt-2 flex items-start gap-1 text-xs text-gray-400">
        <span>📍</span>
        <span>
          Approximate location shown for privacy. Tap a button above to navigate to the
          seller&apos;s area.
        </span>
      </p>
    </>
  );
}
