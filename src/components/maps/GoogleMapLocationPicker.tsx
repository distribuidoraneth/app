'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
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

// Child controller to smoothly re-center when GPS or drag changes
function MapCenterController({
  coords,
  forceCenter,
}: {
  coords: { lat: number; lng: number };
  forceCenter: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(coords);
  }, [map, forceCenter, coords]);

  return null;
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
  const [forceCenterCount, setForceCenterCount] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string>('');

  // Sync coords if prop changes externally (e.g. from parent GPS watch)
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
          setDetectedAddress(data.address);
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

  // Handle marker drag end
  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setCoords({ lat: newLat, lng: newLng });
    performGeocode(newLat, newLng);
  };

  // Handle direct map click to drop/move pin
  const handleMapClick = (e: any) => {
    if (!e.detail?.latLng) return;
    const newLat = e.detail.latLng.lat;
    const newLng = e.detail.latLng.lng;
    setCoords({ lat: newLat, lng: newLng });
    setForceCenterCount((c) => c + 1);
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
        setForceCenterCount((c) => c + 1);
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
      <APIProvider apiKey={apiKey} language="es" region="EC">
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: latitude, lng: longitude }}
          defaultZoom={zoom}
          gestureHandling="greedy"
          disableDefaultUI={true}
          mapTypeControl={false}
          zoomControl={true}
          internalUsageAttributionIds={['gmp_git_agentskills_v1']}
          onClick={handleMapClick}
          className="w-full h-full"
        >
          <MapCenterController coords={coords} forceCenter={forceCenterCount} />

          {/* Draggable Advanced Marker */}
          <AdvancedMarker
            position={coords}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
            title="Arrastra para ajustar la ubicación exacta del local"
          >
            <div className="cursor-grab active:cursor-grabbing flex flex-col items-center group">
              <div className="px-2 py-0.5 bg-blue-700 text-white text-[9px] font-black rounded-md shadow-md mb-1 whitespace-nowrap border border-blue-400 group-hover:scale-105 transition-transform">
                Local aquí • Arrastra
              </div>
              <Pin
                background="#2563eb"
                glyphColor="#ffffff"
                borderColor="#1e40af"
                scale={1.2}
              />
            </div>
          </AdvancedMarker>
        </Map>
      </APIProvider>

      {/* Floating Header Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10 gap-1.5">
        {/* Coordinates badge */}
        <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-xs border border-slate-200/90 flex items-center space-x-1.5 text-[11px] font-bold text-slate-800 pointer-events-auto">
          <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-mono text-[10px]">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        </div>

        {/* GPS Controls & Accuracy */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          {isCalibrating || isLocating ? (
            <div className="bg-blue-600 text-white px-2.5 py-1 rounded-xl shadow-xs text-[10px] font-black flex items-center space-x-1 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Ajustando GPS...</span>
            </div>
          ) : accuracy !== null ? (
            <div
              className={`px-2 py-1 rounded-xl shadow-xs text-[10px] font-black flex items-center space-x-1 ${
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

          {/* GPS Locate Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="bg-white hover:bg-slate-50 text-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-1 text-[11px] font-bold active:scale-95 transition-all"
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
              ? 'Detectando dirección en Google Maps...'
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
