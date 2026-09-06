'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface MarkerItem {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  color?: string;
  onClick?: () => void;
}

interface VectorMapProps {
  latitude: number;
  longitude: number;
  interactive?: boolean;
  draggableMarker?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  markers?: MarkerItem[];
  zoom?: number;
  className?: string;
  showLocateButton?: boolean;
}

// Controller to auto-fit bounds or pan to coordinates
function GoogleMapFitBounds({
  markers,
  center,
}: {
  markers: MarkerItem[];
  center: { lat: number; lng: number };
}) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    if (markers.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((m) =>
        bounds.extend({ lat: m.latitude, lng: m.longitude })
      );
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      fittedRef.current = true;
    } else {
      map.panTo(center);
    }
  }, [map, markers, center]);

  return null;
}

export function VectorMap({
  latitude,
  longitude,
  interactive = true,
  draggableMarker = false,
  onLocationChange,
  markers = [],
  zoom = 15,
  className = 'h-64 w-full rounded-xl overflow-hidden',
  showLocateButton = true,
}: VectorMapProps) {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (process.env.GOOGLE_MAPS_API_KEY as string) ||
    '';

  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: latitude,
    lng: longitude,
  });

  const [activeMarker, setActiveMarker] = useState<MarkerItem | null>(null);

  useEffect(() => {
    setCurrentCoords({ lat: latitude, lng: longitude });
  }, [latitude, longitude]);

  const handleDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setCurrentCoords({ lat: newLat, lng: newLng });
    onLocationChange?.(newLat, newLng);
  };

  const handleMapClick = (e: any) => {
    if (!draggableMarker || !e.detail?.latLng) return;
    const newLat = e.detail.latLng.lat;
    const newLng = e.detail.latLng.lng;
    setCurrentCoords({ lat: newLat, lng: newLng });
    onLocationChange?.(newLat, newLng);
  };

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: userLat, longitude: userLng } = pos.coords;
          setCurrentCoords({ lat: userLat, lng: userLng });
          onLocationChange?.(userLat, userLng);
        },
        (err) => {
          alert(
            'No pudimos obtener la ubicación GPS de tu navegador: ' +
              err.message
          );
        },
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div
      className={`relative ${className} border border-slate-200 shadow-inner bg-slate-100`}
    >
      <APIProvider apiKey={apiKey} language="es" region="EC">
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: latitude, lng: longitude }}
          defaultZoom={zoom}
          gestureHandling={interactive ? 'greedy' : 'none'}
          disableDefaultUI={!interactive}
          zoomControl={interactive}
          internalUsageAttributionIds={['gmp_git_agentskills_v1']}
          onClick={handleMapClick}
          className="w-full h-full"
        >
          <GoogleMapFitBounds markers={markers} center={currentCoords} />

          {/* Main Marker if no extra markers or if draggable */}
          {(markers.length === 0 || draggableMarker) && (
            <AdvancedMarker
              position={currentCoords}
              draggable={draggableMarker}
              onDragEnd={handleDragEnd}
              title="Ubicación"
            >
              <div className="relative flex items-center justify-center">
                <Pin
                  background="#2563eb"
                  borderColor="#1e40af"
                  glyphColor="#ffffff"
                  scale={1.2}
                />
              </div>
            </AdvancedMarker>
          )}

          {/* Additional Multi-Markers */}
          {markers.map((m) => (
            <AdvancedMarker
              key={m.id}
              position={{ lat: m.latitude, lng: m.longitude }}
              onClick={() => {
                setActiveMarker(m);
                m.onClick?.();
              }}
              title={m.title}
            >
              <div className="cursor-pointer group flex flex-col items-center">
                <div className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded shadow mb-1 whitespace-nowrap border border-slate-700 opacity-90 group-hover:opacity-100">
                  {m.title}
                </div>
                <Pin
                  background={
                    m.color === 'emerald-500'
                      ? '#10b981'
                      : m.color === 'amber-500'
                      ? '#f59e0b'
                      : '#2563eb'
                  }
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                />
              </div>
            </AdvancedMarker>
          ))}

          {/* Active Marker InfoWindow */}
          {activeMarker && (
            <InfoWindow
              position={{
                lat: activeMarker.latitude,
                lng: activeMarker.longitude,
              }}
              onCloseClick={() => setActiveMarker(null)}
              maxWidth={240}
            >
              <div className="p-1 space-y-1 text-slate-900">
                <h4 className="font-extrabold text-xs">{activeMarker.title}</h4>
                {activeMarker.subtitle && (
                  <p className="text-[11px] text-slate-500">
                    {activeMarker.subtitle}
                  </p>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeMarker.latitude},${activeMarker.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Abrir en Google Maps →
                </a>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Floating coordinates indicator & Locate button */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center space-x-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] shadow-xs text-slate-700 pointer-events-none">
        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="font-mono font-medium">
          {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
        </span>
      </div>

      {showLocateButton && interactive && (
        <button
          type="button"
          onClick={handleLocateMe}
          title="Detectar mi ubicación GPS actual"
          className="absolute top-2 left-2 z-10 bg-white hover:bg-slate-50 text-slate-800 p-2 rounded-lg border border-slate-200 shadow-md flex items-center space-x-1 text-xs font-semibold transition-transform active:scale-95 cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Mi GPS</span>
        </button>
      )}

      {draggableMarker && (
        <div className="absolute top-2 right-12 z-10 bg-amber-500/95 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] shadow pointer-events-none">
          Arrastra el pin o toca en el mapa para ajustar
        </div>
      )}
    </div>
  );
}
