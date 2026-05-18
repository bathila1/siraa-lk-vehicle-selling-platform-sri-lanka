'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';

import type { PostAdDraft } from './PostAdWizard';

interface Props {
  draft: PostAdDraft;
  update: (patch: Partial<PostAdDraft>) => void;
  districts: { id: number; name_en: string }[];
  cities: { id: number; district_id: number; name_en: string }[];
}

// District-level fallback centers (approximate)
const DISTRICT_CENTERS: Record<string, [number, number]> = {
  Colombo: [6.9271, 79.8612],
  Gampaha: [7.0840, 80.0098],
  Kandy: [7.2906, 80.6337],
  Galle: [6.0535, 80.2210],
  Matara: [5.9485, 80.5353],
  Kurunegala: [7.4863, 80.3623],
  Anuradhapura: [8.3114, 80.4037],
  Jaffna: [9.6615, 80.0255],
  Ratnapura: [6.6828, 80.4036],
  Kalutara: [6.5854, 79.9607],
  Badulla: [6.9934, 81.0550],
  Trincomalee: [8.5874, 81.2152],
  Batticaloa: [7.7104, 81.6924],
  Ampara: [7.2839, 81.6747],
  Hambantota: [6.1241, 81.1185],
  Polonnaruwa: [7.9403, 81.0188],
  Matale: [7.4675, 80.6234],
  'Nuwara Eliya': [6.9497, 80.7891],
  Moneragala: [6.8728, 81.3508],
  Kegalle: [7.2513, 80.3464],
  Puttalam: [8.0408, 79.8394],
  Mannar: [8.9810, 79.9043],
  Vavuniya: [8.7514, 80.4971],
  Kilinochchi: [9.3961, 80.4014],
  Mullaitivu: [9.2671, 80.8128],
};

export function StepLocation({ draft, update, districts, cities }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initStartedRef = useRef(false); // ← ADD THIS
  const [mapReady, setMapReady] = useState(false);

  const filteredCities = useMemo(
    () => cities.filter((c) => c.district_id === draft.districtId),
    [cities, draft.districtId],
  );

  const selectedDistrict = districts.find((d) => d.id === draft.districtId);
  const initialCenter: [number, number] = useMemo(() => {
    if (draft.lat && draft.lng) return [draft.lat, draft.lng];
    if (selectedDistrict && DISTRICT_CENTERS[selectedDistrict.name_en]) {
      return DISTRICT_CENTERS[selectedDistrict.name_en];
    }
    return [7.8731, 80.7718]; // Sri Lanka center
  }, [draft.lat, draft.lng, selectedDistrict]);

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;

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

      // Wipe any leftover Leaflet state on the container (defensive)
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
        container.innerHTML = '';
      }

      const mapInstance = L.map(container, {
        center: initialCenter,
        zoom: draft.lat ? 14 : 8,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(mapInstance);

      const marker = L.marker(initialCenter, { draggable: true }).addTo(mapInstance);

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        update({ lat, lng });
      });

      mapInstance.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        update({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapRef.current = mapInstance;
      markerRef.current = marker;
      setMapReady(true);
    };

    loadMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      initStartedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentre when district changes (only if not yet pinned)
  useEffect(() => {
    if (!mapReady || !mapRef.current || !markerRef.current) return;
    if (draft.lat || !selectedDistrict) return;
    const center = DISTRICT_CENTERS[selectedDistrict.name_en];
    if (center) {
      mapRef.current.setView(center, 11);
      markerRef.current.setLatLng(center);
    }
  }, [draft.districtId, mapReady, selectedDistrict, draft.lat]);

  return (
    <div className="space-y-4">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <h2 className="font-semibold text-base">Location</h2>

      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 block">
          District <span className="text-red-500">*</span>
        </label>
        <select
          value={draft.districtId ?? ''}
          onChange={(e) =>
            update({
              districtId: e.target.value ? Number(e.target.value) : null,
              cityId: null,
            })
          }
          className="w-full p-3 text-sm border-2 border-[var(--color-border)] rounded-lg focus:border-[var(--brand-green)] outline-none"
        >
          <option value="">Select district</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{d.name_en}</option>
          ))}
        </select>
      </div>

      {draft.districtId && filteredCities.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1.5 block">
            City / Area
          </label>
          <select
            value={draft.cityId ?? ''}
            onChange={(e) => update({ cityId: e.target.value ? Number(e.target.value) : null })}
            className="w-full p-3 text-sm border-2 border-[var(--color-border)] rounded-lg focus:border-[var(--brand-green)] outline-none"
          >
            <option value="">Select city (optional)</option>
            {filteredCities.map((c) => (
              <option key={c.id} value={c.id}>{c.name_en}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 block flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Pin location on map (optional)
        </label>
        <div
          ref={mapContainerRef}
          className="w-full h-64 rounded-lg overflow-hidden border-2 border-[var(--color-border)]"
        />
        <p className="text-xs text-gray-400 mt-1">
          {draft.lat
            ? `📍 Location pinned (${draft.lat.toFixed(4)}, ${draft.lng?.toFixed(4)})`
            : 'Tap on the map to drop a pin'}
        </p>
        <p className="text-xs text-gray-400">
          Buyers will see a ~500m radius circle, not your exact spot.
        </p>
      </div>
    </div>
  );
}
