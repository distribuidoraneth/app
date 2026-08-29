'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface VectorMapProps {
  latitude: number;
  longitude: number;
  interactive?: boolean;
  draggableMarker?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    subtitle?: string;
    color?: string;
    onClick?: () => void;
  }>;
  zoom?: number;
  className?: string;
  showLocateButton?: boolean;
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
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const mainMarkerRef = useRef<maplibregl.Marker | null>(null);
  const additionalMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: latitude,
    lng: longitude,
  });

  // Free high-contrast minimalist vector-compatible style (Carto Positron)
  const mapStyle = {
    version: 8 as const,
    sources: {
      'osm-tiles': {
        type: 'raster' as const,
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
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

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [longitude, latitude],
        zoom: zoom,
        interactive: interactive,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

      // Create Custom Animated Main Marker
      const markerEl = document.createElement('div');
      markerEl.className = 'relative flex items-center justify-center';
      markerEl.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white z-10">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
        <div class="absolute w-12 h-12 rounded-full bg-blue-500/30 animate-ping"></div>
      `;

      const marker = new maplibregl.Marker({
        element: markerEl,
        draggable: draggableMarker,
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      if (draggableMarker) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          setCurrentCoords({ lat: lngLat.lat, lng: lngLat.lng });
          onLocationChange?.(lngLat.lat, lngLat.lng);
        });
      }

      mainMarkerRef.current = marker;
      mapInstance.current = map;

      // Handle map click if draggable
      if (interactive && draggableMarker) {
        map.on('click', (e) => {
          marker.setLngLat(e.lngLat);
          setCurrentCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          onLocationChange?.(e.lngLat.lat, e.lngLat.lng);
        });
      }
    } catch (err) {
      console.error('Error initializing map:', err);
    }

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update center when props change
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.flyTo({
        center: [longitude, latitude],
        zoom: zoom,
        essential: true,
      });
      mainMarkerRef.current?.setLngLat([longitude, latitude]);
      setCurrentCoords({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude, zoom]);

  // Handle additional markers
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old markers
    additionalMarkersRef.current.forEach((m) => m.remove());
    additionalMarkersRef.current = [];

    markers.forEach((m) => {
      const el = document.createElement('div');
      el.className = 'cursor-pointer group flex flex-col items-center';
      el.innerHTML = `
        <div class="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded shadow mb-1 whitespace-nowrap border border-slate-700 opacity-90 group-hover:opacity-100">
          ${m.title}
        </div>
        <div class="w-7 h-7 rounded-full bg-${m.color || 'emerald-500'} border-2 border-white shadow-lg flex items-center justify-center text-white">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        </div>
      `;

      if (m.onClick) {
        el.addEventListener('click', m.onClick);
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([m.longitude, m.latitude])
        .addTo(mapInstance.current!);

      additionalMarkersRef.current.push(marker);
    });
  }, [markers]);

  // Geolocation button handler
  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: userLat, longitude: userLng } = pos.coords;
          if (mapInstance.current) {
            mapInstance.current.flyTo({ center: [userLng, userLat], zoom: 16 });
            mainMarkerRef.current?.setLngLat([userLng, userLat]);
            setCurrentCoords({ lat: userLat, lng: userLng });
            onLocationChange?.(userLat, userLng);
          }
        },
        (err) => {
          alert('No pudimos obtener la ubicación GPS de tu navegador: ' + err.message);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div className={`relative ${className} border border-slate-200 shadow-inner bg-slate-100`}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating coordinates indicator & Locate button */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center space-x-1.5 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] shadow-sm text-slate-700">
        <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
        <span className="font-mono font-medium">
          {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
        </span>
      </div>

      {showLocateButton && interactive && (
        <button
          type="button"
          onClick={handleLocateMe}
          title="Detectar mi ubicación GPS actual"
          className="absolute top-2 left-2 z-10 bg-white hover:bg-slate-50 text-slate-800 p-2 rounded-lg border border-slate-200 shadow-md flex items-center space-x-1 text-xs font-semibold transition-transform active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Mi GPS</span>
        </button>
      )}

      {draggableMarker && (
        <div className="absolute top-2 right-12 z-10 bg-amber-500/90 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] shadow">
          Arrastra el pin o toca en el mapa para ajustar
        </div>
      )}
    </div>
  );
}
