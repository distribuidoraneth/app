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
} from 'lucide-react';
import Link from 'next/link';

interface GoogleMapDirectoryProps {
  clients: Client[];
  selectedClientId?: string;
  onSelectClient?: (client: Client) => void;
  className?: string;
  heightClassName?: string;
}

// Internal child component to control camera bounds smoothly
function MapBoundsController({
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

  // Fit all locations
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

  // Initial fit when map and clients are ready
  useEffect(() => {
    if (!map || clients.length === 0 || initialFitDone.current) return;
    fitAll();
    initialFitDone.current = true;
  }, [map, clients, fitAll]);

  // User explicitly clicked "Ver Todos"
  useEffect(() => {
    if (triggerFitAll > 0) {
      fitAll();
    }
  }, [triggerFitAll, fitAll]);

  // Focus a specific client when clicked from search or card
  useEffect(() => {
    if (map && focusClient) {
      map.panTo({ lat: focusClient.latitude, lng: focusClient.longitude });
      map.setZoom(17);
    }
  }, [map, focusClient]);

  return null;
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
      {/* Top Map Control Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-2 pointer-events-none">
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
            className="bg-white hover:bg-slate-50 text-slate-700 p-2 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center space-x-1 text-xs font-bold"
            title="Buscar local en el mapa"
          >
            <Search className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Buscar local</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setTriggerFitAll((v) => v + 1)}
            className="bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center space-x-1.5 text-xs font-bold"
            title="Enfocar todos los locales registrados"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Ver Todos</span>
          </button>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center space-x-1.5 text-xs font-bold disabled:opacity-50"
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

      {/* Main Google Map Container */}
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
            {/* Bound Controller */}
            <MapBoundsController
              clients={validClients}
              userLocation={userLocation}
              triggerFitAll={triggerFitAll}
              focusClient={selectedClient}
            />

            {/* Driver / Admin Current Location Pin */}
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

            {/* Client Markers */}
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
                    {/* Badge Pill with store name */}
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

            {/* Selected Client InfoWindow */}
            {selectedClient && (
              <InfoWindow
                position={{
                  lat: selectedClient.latitude,
                  lng: selectedClient.longitude,
                }}
                onCloseClick={() => setSelectedClient(null)}
                maxWidth={300}
              >
                <div className="p-1 space-y-2.5 text-slate-800 font-sans">
                  {/* Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {selectedClient.clientTier === 'distribuidor'
                          ? 'Distribuidor'
                          : selectedClient.clientTier === 'especial'
                          ? 'Especial'
                          : 'Cliente'}
                      </span>
                      {(selectedClient.currentDebt || 0) > 0 ? (
                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                          <AlertCircle className="w-2.5 h-2.5 inline mr-0.5" />
                          Deuda: ${(selectedClient.currentDebt || 0).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Al día
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-1 leading-tight">
                      {selectedClient.businessName || selectedClient.fullName}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {selectedClient.fullName}
                    </p>
                  </div>

                  {/* Address & Distance */}
                  <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="leading-snug line-clamp-2">
                      📍 {selectedClient.addressReference || 'Sin referencia registrada'}
                    </p>
                    {userLocation && (
                      <p className="text-[10px] text-blue-600 font-bold flex items-center space-x-1">
                        <Navigation className="w-3 h-3 inline mr-0.5" />
                        <span>
                          {formatDistance(
                            calculateDistanceMeters(
                              userLocation.lat,
                              userLocation.lng,
                              selectedClient.latitude,
                              selectedClient.longitude
                            )
                          )}{' '}
                          desde tu ubicación
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedClient.latitude},${selectedClient.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1 transition-colors"
                      title="Abrir ruta en Google Maps"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Cómo llegar</span>
                    </a>

                    {selectedClient.whatsappNumber ? (
                      <a
                        href={`https://wa.me/593${selectedClient.whatsappNumber.replace(/^0/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1 transition-colors"
                        title="Enviar mensaje por WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <div className="text-[10px] text-slate-400 flex items-center justify-center">
                        Sin teléfono
                      </div>
                    )}
                  </div>

                  {/* Make Order CTA */}
                  <Link
                    href={`/pedido?client=${selectedClient.id}`}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-transform active:scale-95 text-center"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Crear Pedido para este Local</span>
                  </Link>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Bottom Attribution / Status Indicator */}
      <div className="px-3 py-1.5 bg-white/95 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Google Maps Platform oficial • Cobertura Nacional</span>
        </div>
        <div className="font-mono text-slate-400">
          Ecuador (Ambato - Quito)
        </div>
      </div>
    </div>
  );
}
