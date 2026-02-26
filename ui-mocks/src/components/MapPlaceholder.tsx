import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const token = import.meta.env.VITE_MAPBOX_TOKEN as string;
if (!token) {
  console.error('[MapPlaceholder] VITE_MAPBOX_TOKEN is empty.');
}
mapboxgl.accessToken = token;

interface MapPlaceholderProps {
  className?: string;
  showVehicleMarker?: boolean;
  showRoute?: boolean;
  routeCoordinates?: [number, number][];
  vehiclePosition?: [number, number];
  heading?: number;
  center?: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  interactive?: boolean;
}

function distSq(a: [number, number], b: [number, number]): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

function splitRoute(coords: [number, number][], vehiclePos: [number, number]) {
  let closestIdx = 0;
  let closestDist = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = distSq(coords[i], vehiclePos);
    if (d < closestDist) {
      closestDist = d;
      closestIdx = i;
    }
  }
  return {
    completed: coords.slice(0, closestIdx + 1),
    remaining: coords.slice(closestIdx),
  };
}

export function MapPlaceholder({
  className = '',
  showVehicleMarker = true,
  showRoute = false,
  routeCoordinates,
  vehiclePosition,
  heading = 0,
  center = [-97.7431, 30.2672],
  zoom = 12,
  children,
  interactive = true,
}: MapPlaceholderProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const markerElRef = useRef<HTMLDivElement | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const endMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Use STATE for mapLoaded so changes trigger re-renders and effect re-runs
  const [mapLoaded, setMapLoaded] = useState(false);

  // Effect 1: Create map (once)
  useEffect(() => {
    if (!mapContainer.current) return;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom,
      interactive,
      attributionControl: false,
    });

    map.current = m;

    m.on('load', () => {
      m.resize();
      setMapLoaded(true);
    });

    m.on('error', (e) => {
      console.error('[MapPlaceholder] Mapbox error:', e.error?.message ?? e);
    });

    // Pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes goldPulse {
        0%, 100% { transform: scale(1); opacity: 0.2; }
        50% { transform: scale(1.5); opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      setMapLoaded(false);
      m.remove();
      map.current = null;
      markerRef.current = null;
      markerElRef.current = null;
      startMarkerRef.current?.remove();
      startMarkerRef.current = null;
      endMarkerRef.current?.remove();
      endMarkerRef.current = null;
      style.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect 2: Vehicle marker
  useEffect(() => {
    const m = map.current;
    if (!m || !showVehicleMarker) return;

    const pos = vehiclePosition || center;

    if (!markerElRef.current) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(201,168,76,0.2);animation:goldPulse 2s ease-in-out infinite;"></div>
          <svg width="32" height="32" viewBox="0 0 32 32" style="transform:rotate(${heading}deg);position:relative;z-index:1;">
            <polygon points="16,2 12,11 16,8 20,11" fill="#C9A84C" opacity="0.9"/>
            <circle cx="16" cy="18" r="8" fill="#C9A84C"/>
            <circle cx="16" cy="18" r="4" fill="rgba(10,10,10,0.3)"/>
          </svg>
        </div>
      `;
      markerElRef.current = el;
      markerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(pos).addTo(m);
    } else {
      markerRef.current?.setLngLat(pos);
    }
  }, [showVehicleMarker, vehiclePosition, center, heading, mapLoaded]);

  // Effect 3: Heading rotation
  useEffect(() => {
    if (markerElRef.current) {
      const svg = markerElRef.current.querySelector('svg');
      if (svg) svg.style.transform = `rotate(${heading}deg)`;
    }
  }, [heading]);

  // Effect 4: Route — depends on mapLoaded STATE so it re-runs when map finishes loading
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;

    // Clean up previous route layers/sources
    const ids = ['route-completed', 'route-remaining', 'route'];
    for (const id of ids) {
      try { if (m.getLayer(id)) m.removeLayer(id); } catch { /* ignore */ }
      try { if (m.getSource(id)) m.removeSource(id); } catch { /* ignore */ }
    }
    startMarkerRef.current?.remove();
    startMarkerRef.current = null;
    endMarkerRef.current?.remove();
    endMarkerRef.current = null;

    if (!showRoute || !routeCoordinates || routeCoordinates.length < 2) return;

    const vPos = vehiclePosition || center;
    const { completed, remaining } = splitRoute(routeCoordinates, vPos);

    try {
      // Completed segment (dim gold — already traveled)
      if (completed.length >= 2) {
        m.addSource('route-completed', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: completed } },
        });
        m.addLayer({
          id: 'route-completed',
          type: 'line',
          source: 'route-completed',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#C9A84C', 'line-width': 4, 'line-opacity': 0.3 },
        });
      }

      // Remaining segment (bright gold — ahead)
      if (remaining.length >= 2) {
        m.addSource('route-remaining', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: remaining } },
        });
        m.addLayer({
          id: 'route-remaining',
          type: 'line',
          source: 'route-remaining',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#C9A84C', 'line-width': 4, 'line-opacity': 0.9 },
        });
      }
    } catch (err) {
      console.error('[MapPlaceholder] Failed to add route:', err);
    }

    // Start marker (green)
    const startEl = document.createElement('div');
    startEl.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#30D158;border:2px solid rgba(255,255,255,0.5);box-shadow:0 0 6px rgba(48,209,88,0.5);';
    startMarkerRef.current = new mapboxgl.Marker({ element: startEl }).setLngLat(routeCoordinates[0]).addTo(m);

    // End marker (gold)
    const endEl = document.createElement('div');
    endEl.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#C9A84C;border:2px solid rgba(255,255,255,0.5);box-shadow:0 0 6px rgba(201,168,76,0.5);';
    endMarkerRef.current = new mapboxgl.Marker({ element: endEl }).setLngLat(routeCoordinates[routeCoordinates.length - 1]).addTo(m);

    // Auto-fit map to show the full route
    const bounds = new mapboxgl.LngLatBounds();
    routeCoordinates.forEach(c => bounds.extend(c as [number, number]));
    m.fitBounds(bounds, { padding: { top: 80, bottom: 300, left: 60, right: 60 }, maxZoom: 15 });

  }, [mapLoaded, showRoute, routeCoordinates, vehiclePosition, center]);

  // Fit bounds callback
  const fitToRoute = useCallback(() => {
    const m = map.current;
    if (!m || !routeCoordinates || routeCoordinates.length < 2) return;
    const bounds = new mapboxgl.LngLatBounds();
    routeCoordinates.forEach(c => bounds.extend(c as [number, number]));
    m.fitBounds(bounds, { padding: { top: 80, bottom: 300, left: 60, right: 60 }, maxZoom: 15 });
  }, [routeCoordinates]);

  // Wrapper styling
  const isAbsolute = /\babsolute\b/.test(className);
  const hasExplicitHeight = /\bh-/.test(className) || /\binset-/.test(className);
  const wrapperStyle: React.CSSProperties = { width: '100%' };
  if (!isAbsolute) wrapperStyle.position = 'relative';
  if (!hasExplicitHeight) wrapperStyle.height = '100%';

  const showFitButton = showRoute && routeCoordinates && routeCoordinates.length >= 2;

  return (
    <div className={className} style={wrapperStyle}>
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {showFitButton && (
        <button
          onClick={fitToRoute}
          style={{
            position: 'absolute', bottom: 310, right: 16, zIndex: 30,
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(30,30,30,0.85)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
          title="Zoom to fit route"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 7V3H7" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 3H17V7" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 13V17H13" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 17H3V13" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {children}
    </div>
  );
}
