'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Client } from '@/types';
import { calculateDistanceMeters, formatDistance } from '@/lib/utils/geo';
import {
  MapPin,
  Navigation,
  Compass,
  Phone,
  MessageCircle,
  ExternalLink,
  ShoppingBag,
  AlertCircle,
  Layers,
  Search,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import Link from 'next/link';

interface GoogleMapDirectoryProps {
  clients: Client[];
  selectedClientId?: string;
  onSelectClient?: (client: Client) => void;
  className?: string;
  heightClassName?: string;
}

// Controller for Google Maps camera bounds
function GoogleMapBoundsController({
  clients,
  userLocation,
  triggerFitAll,
  focusClient,
}: {
  clients: Client[];
  userLocation: { lat: number; lng: number } | null;
  triggerFitAll: number;
  focusClient: Client | null;
}) {
  const map = useMap();
  const initialFitDone = useRef(false);

  const fitAll = useCallback(() => {
    if (!map || clients.length === 0) return;
    const validClients = clients.filter(
      (c) =>
        typeof c.latitude === 'number' &&
        typeof c.longitude === 'number' &&
        !isNaN(c.latitude) &&
        !isNaN(c.longitude)
    );
    if (validClients.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    validClients.forEach((c) =>
      bounds.extend({ lat: c.latitude, lng: c.longitude })
    );

    if (userLocation) {
      bounds.extend(userLocation);
    }

    if (validClients.length === 1 && !userLocation) {
      map.setCenter({
        lat: validClients[0].latitude,
        lng: validClients[0].longitude,
      });
      map.setZoom(15);
    } else {
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 50, right: 50 });
    }
  }, [map, clients, userLocation]);

  useEffect(() => {
    if (!map || clients.length === 0 || initialFitDone.current) return;
    fitAll();
    initialFitDone.current = true;
  }, [map, clients, fitAll]);

  useEffect(() => {
    if (triggerFitAll > 0) {
      fitAll();
    }
  }, [triggerFitAll, fitAll]);

  useEffect(() => {
    if (map && focusClient) {
      map.panTo({ lat: focusClient.latitude, lng: focusClient.longitude });
      map.setZoom(17);
    }
  }, [map, focusClient]);

  return null;
}

// Clean Vector Map Engine (Zero watermarks / No billing required)
function CleanVectorMapEngine({
  clients,
  selectedClient,
  onSelectClient,
  userLocation,
  triggerFitAll,
  heightClassName,
}: {
  clients: Client[];
  selectedClient: Client | null;
  onSelectClient: (c: Client | null) => void;
  userLocation: { lat: number; lng: number } | null;
  triggerFitAll: number;
  heightClassName: string;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const validClients = useMemo(() => {
    return clients.filter(
      (c) =>
        typeof c.latitude === 'number' &&
        typeof c.longitude === 'number' &&
        !isNaN(c.latitude) &&
        !isNaN(c.longitude)
    );
  }, [clients]);

  // Clean Positron / OSM style
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

  const fitAllBounds = useCallback(() => {
    if (!mapInstance.current || validClients.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    validClients.forEach((c) => bounds.extend([c.longitude, c.latitude]));
    if (userLocation) bounds.extend([userLocation.lng, userLocation.lat]);

    if (validClients.length === 1 && !userLocation) {
      mapInstance.current.setCenter([
        validClients[0].longitude,
        validClients[0].latitude,
      ]);
      mapInstance.current.setZoom(15);
    } else {
      mapInstance.current.fitBounds(bounds, { padding: 60, maxZoom: 16 });
    }
  }, [validClients, userLocation]);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const initialCenter: [number, number] =
      validClients.length > 0
        ? [validClients[0].longitude, validClients[0].latitude]
        : [-78.61675, -1.24908];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: initialCenter,
      zoom: 13,
      interactive: true,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
      'top-right'
    );

    map.on('load', () => {
      fitAllBounds();
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update bounds when requested
  useEffect(() => {
    if (triggerFitAll > 0) {
      fitAllBounds();
    }
  }, [triggerFitAll, fitAllBounds]);

  // Render client markers
  useEffect(() => {
    if (!mapInstance.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    validClients.forEach((client) => {
      const isSelected = selectedClient?.id === client.id;
      const hasDebt = (client.currentDebt || 0) > 0;

      const el = document.createElement('div');
      el.className =
        'cursor-pointer group flex flex-col items-center transition-transform hover:scale-110';
      el.innerHTML = `
        <div class="px-2 py-0.5 text-[10px] font-extrabold rounded-md shadow-md mb-1 whitespace-nowrap border ${
          isSelected
            ? 'bg-blue-600 text-white border-blue-400 scale-105'
            : hasDebt
            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
            : 'bg-slate-900/90 text-white border-slate-700'
        }">
          ${client.businessName || client.fullName}
        </div>
        <div class="w-7 h-7 rounded-full ${
          isSelected ? 'bg-blue-600 ring-4 ring-blue-300' : hasDebt ? 'bg-amber-500' : 'bg-blue-600'
        } border-2 border-white shadow-lg flex items-center justify-center text-white">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectClient(client);
        mapInstance.current?.flyTo({
          center: [client.longitude, client.latitude],
          zoom: 16,
          essential: true,
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([client.longitude, client.latitude])
        .addTo(mapInstance.current!);

      markersRef.current.push(marker);
    });
  }, [validClients, selectedClient, onSelectClient]);

  // Render user GPS beacon
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const userEl = document.createElement('div');
      userEl.className = 'relative flex items-center justify-center';
      userEl.innerHTML = `
        <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xl z-10"></div>
        <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
      `;

      userMarkerRef.current = new maplibregl.Marker({ element: userEl })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapInstance.current);
    }
  }, [userLocation]);

  return (
    <div className={`relative ${heightClassName} w-full`}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}

export function GoogleMapDirectory({
  clients,
  selectedClientId,
  onSelectClient,
  className = '',
  heightClassName = 'h-80 sm:h-[420px]',
}: GoogleMapDirectoryProps) {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (process.env.GOOGLE_MAPS_API_KEY as string) ||
    '';

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [triggerFitAll, setTriggerFitAll] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fallback Engine State
  const [mapEngine, setMapEngine] = useState<'clean' | 'google'>('clean');
  const [hasGoogleAuthError, setHasGoogleAuthError] = useState<boolean>(true);
  const [showCloudBillingInfo, setShowCloudBillingInfo] = useState<boolean>(false);

  // Catch Google Maps auth / billing failures globally
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prevFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn(
        'Google Maps Platform: Falta vincular Facturación en Google Cloud para la clave API. Conmutando a Modo Limpio.'
      );
      setHasGoogleAuthError(true);
      setMapEngine('clean');
      if (typeof prevFailure === 'function') {
        prevFailure();
      }
    };

    return () => {
      (window as any).gm_authFailure = prevFailure;
    };
  }, []);

  // Filter clients with valid coordinates
  const validClients = useMemo(() => {
    return clients.filter(
      (c) =>
        typeof c.latitude === 'number' &&
        typeof c.longitude === 'number' &&
        !isNaN(c.latitude) &&
        !isNaN(c.longitude)
    );
  }, [clients]);

  // Filter for in-map quick search
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return validClients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.businessName && c.businessName.toLowerCase().includes(q)) ||
        (c.addressReference && c.addressReference.toLowerCase().includes(q))
    );
  }, [validClients, searchQuery]);

  // Select initial client if passed via props
  useEffect(() => {
    if (selectedClientId) {
      const found = validClients.find((c) => c.id === selectedClientId);
      if (found) setSelectedClient(found);
    }
  }, [selectedClientId, validClients]);

  // Continuous watch of driver/admin GPS
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  // Center on user GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Tu dispositivo no soporta geolocalización.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        alert('No pudimos acceder a tu GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Center fallback: Ambato, Ecuador
  const defaultCenter = useMemo(() => {
    if (validClients.length > 0) {
      return { lat: validClients[0].latitude, lng: validClients[0].longitude };
    }
    return { lat: -1.24908, lng: -78.61675 };
  }, [validClients]);

  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-100 ${className}`}
    >
      {/* Top Notice if Google Maps Billing is required */}
      {hasGoogleAuthError && mapEngine === 'google' && (
        <div className="bg-amber-500 text-slate-950 px-3 py-1.5 text-xs font-bold flex items-center justify-between gap-2 z-30 relative shadow-sm">
          <div className="flex items-center space-x-1.5 truncate">
            <AlertCircle className="w-4 h-4 shrink-0 text-slate-950" />
            <span className="truncate">
              Google Maps requiere vincular Facturación en Google Cloud para quitar la marca de agua.
            </span>
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setMapEngine('clean')}
              className="px-2 py-0.5 bg-slate-950 text-white hover:bg-slate-800 rounded-md text-[11px] font-black transition-colors"
            >
              Usar Modo Limpio
            </button>
            <button
              type="button"
              onClick={() => setShowCloudBillingInfo((v) => !v)}
              className="p-0.5 text-slate-900 hover:text-slate-950"
              title="Información"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Cloud Billing Explanation Modal/Card */}
      {showCloudBillingInfo && (
        <div className="p-3 bg-white border-b border-slate-200 text-slate-800 text-xs space-y-1.5 z-30 relative">
          <div className="flex items-center justify-between">
            <h5 className="font-black text-slate-900 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 mr-1" />
              ¿Cómo activar Google Maps oficial sin avisos?
            </h5>
            <button
              type="button"
              onClick={() => setShowCloudBillingInfo(false)}
              className="text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-slate-600">
            Google exige vincular una forma de pago en la consola de Google Cloud para autorizar el SDK satelital (Google otorga <strong>$200 USD gratuitos cada mes</strong>, por lo que no pagarás nada por el uso habitual).
          </p>
          <div className="flex items-center space-x-2 pt-1">
            <a
              href="https://console.cloud.google.com/project/_/billing/enable"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-blue-600 hover:underline font-bold text-[11px]"
            >
              <span>Ir a Google Cloud Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => {
                setMapEngine('clean');
                setShowCloudBillingInfo(false);
              }}
              className="text-emerald-700 font-bold text-[11px] hover:underline cursor-pointer"
            >
              Continuar con Modo Limpio (Recomendado)
            </button>
          </div>
        </div>
      )}

      {/* Top Map Control Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-2 pointer-events-none">
        {/* Search / Status Badge */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2 text-xs font-bold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="font-mono text-slate-700">
              {validClients.length} {validClients.length === 1 ? 'local' : 'locales'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className="bg-white hover:bg-slate-50 text-slate-700 p-2 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center space-x-1 text-xs font-bold cursor-pointer"
            title="Buscar local en el mapa"
          >
            <Search className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Buscar local</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          {/* Switcher Engine */}
          <button
            type="button"
            onClick={() =>
              setMapEngine((prev) => (prev === 'clean' ? 'google' : 'clean'))
            }
            className={`px-2.5 py-1.5 rounded-xl border shadow-sm transition-all active:scale-95 flex items-center space-x-1.5 text-xs font-bold cursor-pointer ${
              mapEngine === 'clean'
                ? 'bg-white hover:bg-slate-50 text-emerald-700 border-emerald-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Cambiar entre modo limpio y Google Maps"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">
              {mapEngine === 'clean' ? 'Modo Limpio' : 'Google Maps'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTriggerFitAll((v) => v + 1)}
            className="bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
            title="Enfocar todos los locales registrados"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Ver Todos</span>
          </button>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center space-x-1.5 text-xs font-bold disabled:opacity-50 cursor-pointer"
            title="Centrar en mi ubicación GPS"
          >
            <Navigation
              className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Mi GPS</span>
          </button>
        </div>
      </div>

      {/* Floating Quick Search Drawer */}
      {isSearchOpen && (
        <div className="absolute top-14 left-2.5 right-2.5 sm:left-4 sm:right-auto sm:w-80 z-20 bg-white/98 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 space-y-2 animate-in fade-in slide-from-top-2 duration-150 pointer-events-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o dirección..."
              className="w-full text-xs px-3 py-2 pl-8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 font-medium"
              autoFocus
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <p className="text-[11px] text-slate-500 p-2 text-center">
                  No se encontraron locales.
                </p>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      setSelectedClient(client);
                      onSelectClient?.(client);
                      setIsSearchOpen(false);
                    }}
                    className="w-full text-left p-2 hover:bg-blue-50 rounded-xl transition-colors flex flex-col space-y-0.5 cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-900">
                      {client.businessName || client.fullName}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">
                      {client.addressReference || 'Sin referencia'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Map Render: Clean Vector Map OR Google Maps Platform */}
      {mapEngine === 'clean' ? (
        <CleanVectorMapEngine
          clients={validClients}
          selectedClient={selectedClient}
          onSelectClient={(c) => {
            setSelectedClient(c);
            if (c) onSelectClient?.(c);
          }}
          userLocation={userLocation}
          triggerFitAll={triggerFitAll}
          heightClassName={heightClassName}
        />
      ) : (
        <div className={`${heightClassName} w-full`}>
          <APIProvider apiKey={apiKey} language="es" region="EC">
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={defaultCenter}
              defaultZoom={13}
              gestureHandling="greedy"
              disableDefaultUI={false}
              mapTypeControl={true}
              zoomControl={true}
              streetViewControl={false}
              fullscreenControl={true}
              internalUsageAttributionIds={['gmp_git_agentskills_v1']}
              className="w-full h-full"
            >
              <GoogleMapBoundsController
                clients={validClients}
                userLocation={userLocation}
                triggerFitAll={triggerFitAll}
                focusClient={selectedClient}
              />

              {userLocation && (
                <AdvancedMarker
                  position={userLocation}
                  title="Tu ubicación actual (GPS)"
                >
                  <div className="relative flex items-center justify-center pointer-events-none">
                    <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xl z-10" />
                    <div className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping" />
                  </div>
                </AdvancedMarker>
              )}

              {validClients.map((client) => {
                const isSelected = selectedClient?.id === client.id;
                const hasDebt = (client.currentDebt || 0) > 0;

                return (
                  <AdvancedMarker
                    key={client.id}
                    position={{ lat: client.latitude, lng: client.longitude }}
                    onClick={() => {
                      setSelectedClient(client);
                      onSelectClient?.(client);
                    }}
                    title={client.businessName || client.fullName}
                  >
                    <div className="cursor-pointer group flex flex-col items-center transition-transform hover:scale-110">
                      <div
                        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md shadow-md mb-0.5 whitespace-nowrap border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-400 scale-105'
                            : hasDebt
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                            : 'bg-slate-900/90 text-white border-slate-700'
                        }`}
                      >
                        {client.businessName || client.fullName}
                      </div>

                      <Pin
                        background={
                          isSelected ? '#2563eb' : hasDebt ? '#f59e0b' : '#3b82f6'
                        }
                        glyphColor="#ffffff"
                        borderColor={
                          isSelected ? '#1e40af' : hasDebt ? '#b45309' : '#1d4ed8'
                        }
                        scale={isSelected ? 1.2 : 1.0}
                      />
                    </div>
                  </AdvancedMarker>
                );
              })}

              {selectedClient && (
                <InfoWindow
                  position={{
                    lat: selectedClient.latitude,
                    lng: selectedClient.longitude,
                  }}
                  onCloseClick={() => setSelectedClient(null)}
                  maxWidth={300}
                >
                  <div className="p-1 space-y-2 text-slate-800 font-sans">
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {selectedClient.businessName || selectedClient.fullName}
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      {selectedClient.addressReference || 'Sin dirección registrada'}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>
      )}

      {/* Persistent Selected Client Card Drawer (Bottom overlay) */}
      {selectedClient && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 space-y-2 animate-in fade-in slide-from-bottom-2 duration-150">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-black text-sm text-slate-900 leading-tight">
                  {selectedClient.businessName || selectedClient.fullName}
                </h4>
                {(selectedClient.currentDebt || 0) > 0 && (
                  <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                    Deuda: ${(selectedClient.currentDebt || 0).toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {selectedClient.fullName} • 📍{' '}
                {selectedClient.addressReference || 'Sin referencia'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedClient(null)}
              className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            {userLocation && (
              <span className="text-[10px] text-blue-600 font-bold flex items-center">
                <Navigation className="w-3 h-3 mr-1" />
                {formatDistance(
                  calculateDistanceMeters(
                    userLocation.lat,
                    userLocation.lng,
                    selectedClient.latitude,
                    selectedClient.longitude
                  )
                )}
              </span>
            )}

            <div className="flex items-center space-x-1.5 ml-auto">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedClient.latitude},${selectedClient.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-colors"
                title="Abrir ruta en Google Maps"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Cómo llegar</span>
              </a>

              {selectedClient.whatsappNumber && (
                <a
                  href={`https://wa.me/593${selectedClient.whatsappNumber.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-colors"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
              )}

              <Link
                href={`/pedido?client=${selectedClient.id}`}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold flex items-center space-x-1 shadow-xs transition-transform active:scale-95"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Pedir</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Attribution Bar */}
      <div className="px-3 py-1.5 bg-white/95 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>
            {mapEngine === 'clean'
              ? 'Mapa Vectorial Limpio • Sin marcas de desarrollo'
              : 'Google Maps Platform Oficial'}
          </span>
        </div>
        <div className="font-mono text-slate-400">
          Ecuador (Ambato - Quito)
        </div>
      </div>
    </div>
  );
}
