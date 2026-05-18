'use client';

import { useEffect, useRef } from 'react';

interface LocationMapProps {
  lat: number;
  lng: number;
  label: string;
}

/**
 * OpenStreetMap via Leaflet — free, no API key needed.
 * Shows a ~500m radius circle around the pin (not exact location).
 * Loaded dynamically so it doesn't bloat SSR.
 */
export function LocationMap({ lat, lng, label }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import — Leaflet is browser-only
    const loadMap = async () => {
      const L = (await import('leaflet')).default;

      // Fix Leaflet default marker icons (broken in bundlers)
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // ~500m radius circle — approximate privacy-preserving location
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, label]);

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div
        ref={mapRef}
        className="w-full h-52 rounded-xl overflow-hidden border border-[var(--color-border)]"
        aria-label={`Map showing approximate location in ${label}`}
      />
      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
        📍 Approximate location shown for privacy
      </p>
    </>
  );
}
