'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Navigation,
  MapPin,
  Layers,
  Loader2,
  CheckCircle2,
  Crosshair,
  ExternalLink,
} from 'lucide-react';

interface GoogleMapLocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  accuracy?: number | null;
  isCalibrating?: boolean;
  zoom?: number;
  className?: string;
}

// Clean Vector Map Picker Engine
function CleanVectorPickerEngine({
  coords,
  onCoordsChange,
  zoom,
}: {
  coords: { lat: number; lng: number };
  onCoordsChange: (lat: number, lng: number) => void;
  zoom: number;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const mapStyle = {
    version: 8 as const,
    sources: {
      'osm-tiles': {
        type: 'raster' as const,
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster' as const,
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [coords.lng, coords.lat],
      zoom: zoom,
      interactive: true,
      attributionControl: false,
    });

    const pinEl = document.createElement('div');
    pinEl.className =
      'cursor-grab active:cursor-grabbing flex flex-col items-center group';
    pinEl.innerHTML = `
      <div class="px-2 py-0.5 bg-blue-700 text-white text-[9px] font-black rounded-md shadow-md mb-1 whitespace-nowrap border border-blue-400">
        Local aquí • Arrastra
      </div>
      <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      </div>
    `;

    const marker = new maplibregl.Marker({
      element: pinEl,
      draggable: true,
    })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map);

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      onCoordsChange(lngLat.lat, lngLat.lng);
    });

    map.on('click', (e) => {
      marker.setLngLat(e.lngLat);
      onCoordsChange(e.lngLat.lat, e.lngLat.lng);
    });

    markerRef.current = marker;
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update position if coords change
  useEffect(() => {
    if (mapInstance.current && markerRef.current) {
      markerRef.current.setLngLat([coords.lng, coords.lat]);
      mapInstance.current.panTo([coords.lng, coords.lat]);
    }
  }, [coords.lat, coords.lng]);

  return <div ref={mapContainer} className="w-full h-full" />;
}

export function GoogleMapLocationPicker({
  latitude,
  longitude,
  onLocationChange,
  accuracy = null,
  isCalibrating = false,
  zoom = 17,
  className = 'h-52 sm:h-64 w-full rounded-2xl overflow-hidden',
}: GoogleMapLocationPickerProps) {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (process.env.GOOGLE_MAPS_API_KEY as string) ||
    '';

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: latitude,
    lng: longitude,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapEngine, setMapEngine] = useState<'clean' | 'google'>('clean');

  // Sync coords if prop changes externally
  useEffect(() => {
    setCoords({ lat: latitude, lng: longitude });
  }, [latitude, longitude]);

  // Reverse geocode whenever coordinates are finalized
  const performGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsGeocoding(true);
      try {
        const res = await fetch(`/api/maps/geocode?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        if (data.success && data.address) {
          onLocationChange(lat, lng, data.address);
        } else {
          onLocationChange(lat, lng);
        }
      } catch {
        onLocationChange(lat, lng);
      } finally {
        setIsGeocoding(false);
      }
    },
    [onLocationChange]
  );

  const handleCoordsUpdate = (newLat: number, newLng: number) => {
    setCoords({ lat: newLat, lng: newLng });
    performGeocode(newLat, newLng);
  };

  // Detect current device GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setCoords({ lat: newLat, lng: newLng });
        setIsLocating(false);
        performGeocode(newLat, newLng);
      },
      (err) => {
        setIsLocating(false);
        alert('Error al obtener GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div
      className={`relative ${className} border border-slate-200 shadow-xs bg-slate-100 select-none`}
    >
      <CleanVectorPickerEngine
        coords={coords}
        onCoordsChange={handleCoordsUpdate}
        zoom={zoom}
      />

      {/* Floating Header Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10 gap-1.5">
        <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-xs border border-slate-200/90 flex items-center space-x-1.5 text-[11px] font-bold text-slate-800 pointer-events-auto">
          <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-mono text-[10px]">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 pointer-events-auto">
          {isCalibrating || isLocating ? (
            <div className="bg-blue-600 text-white px-2.5 py-1 rounded-xl shadow-xs text-[10px] font-black flex items-center space-x-1 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Ajustando GPS...</span>
            </div>
          ) : accuracy !== null ? (
            <div
              className={`px-2.5 py-1 rounded-xl shadow-xs text-[10px] font-black flex items-center space-x-1 ${
                accuracy <= 20
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {accuracy <= 20 ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              <span>±{Math.round(accuracy)}m</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="bg-white hover:bg-slate-50 text-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-1 text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
            title="Detectar mi ubicación GPS actual"
          >
            <Crosshair className="w-3 h-3 text-blue-600" />
            <span>Mi GPS</span>
          </button>
        </div>
      </div>

      {/* Floating Drag Hint Bottom Pill */}
      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-slate-900/85 backdrop-blur-xs text-white text-[9px] font-bold px-2.5 py-1 rounded-lg pointer-events-auto flex items-center space-x-1 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>
            {isGeocoding
              ? 'Detectando dirección oficial...'
              : 'Toca en el mapa o arrastra el pin al local'}
          </span>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/95 hover:bg-white text-slate-700 p-1.5 rounded-lg shadow-sm border border-slate-200 pointer-events-auto transition-colors"
          title="Ver en Google Maps"
        >
          <ExternalLink className="w-3 h-3 text-slate-600" />
        </a>
      </div>
    </div>
  );
}
