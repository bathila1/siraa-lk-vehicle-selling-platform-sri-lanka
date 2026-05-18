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
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div
        ref={containerRef}
        className="w-full h-52 rounded-xl overflow-hidden border border-[var(--color-border)]"
        aria-label={`Map showing approximate location in ${label}`}
      />
      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
        📍 Approximate location shown for privacy
      </p>
    </>
  );
}