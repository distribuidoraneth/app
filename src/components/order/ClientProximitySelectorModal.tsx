'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '@/types';
import { useDistribution } from '@/context/DistributionContext';
import { ClientRegistrationModal } from '@/components/admin/ClientRegistrationModal';
import { sortClientsByProximity, GeoCoordinates, ClientWithDistance } from '@/lib/utils/geo';
import { cleanAddress } from '@/lib/utils/formatters';
import { AppleMapPinIcon, AppleStorefrontIcon } from '@/components/ui/AppleIcons';
import {
  Search,
  Plus,
  Navigation,
  Store,
  Check,
  X,
  Phone,
  CreditCard,
  Building2,
  RefreshCw,
  LocateFixed,
} from 'lucide-react';

interface ClientProximitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClientId?: string;
  onSelectClient: (client: Client) => void;
}

export function ClientProximitySelectorModal({
  isOpen,
  onClose,
  selectedClientId,
  onSelectClient,
}: ClientProximitySelectorModalProps) {
  const { clients } = useDistribution();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userLocation, setUserLocation] = useState<GeoCoordinates | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);

  // Request GPS position on open
  useEffect(() => {
    if (!isOpen) return;

    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setIsLocating(false);
        },
        (err) => {
          console.warn('GPS location not available:', err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [isOpen]);

  // Sort and filter clients
  const sortedClients: ClientWithDistance[] = useMemo(() => {
    const sorted = sortClientsByProximity(clients, userLocation);
    if (!searchQuery.trim()) return sorted;

    const q = searchQuery.toLowerCase().trim();
    return sorted.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.businessName && c.businessName.toLowerCase().includes(q)) ||
        (c.taxId && c.taxId.includes(q)) ||
        (c.addressReference && c.addressReference.toLowerCase().includes(q)) ||
        (c.whatsappNumber && c.whatsappNumber.includes(q))
    );
  }, [clients, userLocation, searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 z-[9990] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150 ${isRegisterOpen ? 'hidden' : ''}`}>
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <AppleStorefrontIcon size={18} className="text-blue-600" alt="Tienda" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                  Seleccionar Cliente
                </h3>
                <p className="text-xs text-slate-500 font-semibold flex items-center mt-0.5">
                  {userLocation ? (
                    <span className="text-emerald-600 flex items-center">
                      <Navigation className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Ordenados por cercanía GPS
                    </span>
                  ) : isLocating ? (
                    <span className="text-blue-600 flex items-center">
                      <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Detectando ubicación GPS...
                    </span>
                  ) : (
                    <span>Directorio de clientes</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    setIsLocating(true);
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setUserLocation({
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude,
                        });
                        setIsLocating(false);
                      },
                      () => setIsLocating(false),
                      { enableHighAccuracy: true, timeout: 8000 }
                    );
                  }
                }}
                disabled={isLocating}
                title="Actualizar mi ubicación GPS"
                className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="p-3.5 sm:p-4 bg-white border-b border-slate-100 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por Nombre, Local, RUC o Cédula..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Nuevo Cliente</span>
              </button>
            </div>
          </div>

          {/* Client List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 bg-[#f8fafc]">
            {sortedClients.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <AppleStorefrontIcon size={40} className="text-slate-300 mx-auto" alt="Tienda" />
                <p className="text-xs text-slate-500 font-bold">No se encontraron clientes con esa búsqueda.</p>
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(true)}
                  className="inline-flex items-center space-x-1 text-xs font-black text-blue-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Registrar este local comercial ahora
                </button>
              </div>
            ) : (
              sortedClients.map((client) => {
                const isSelected = client.id === selectedClientId;
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      onSelectClient(client);
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm sm:text-base text-slate-900 truncate">
                          {client.businessName || client.fullName}
                        </span>
                        {client.clientTier === 'distribuidor' && (
                          <span className="text-xs font-black bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">
                            Distribuidor
                          </span>
                        )}
                        {client.clientTier === 'especial' && (
                          <span className="text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                            Especial
                          </span>
                        )}
                        {client.distanceFormatted && userLocation && (
                          <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0 flex items-center">
                            <Navigation className="w-3 h-3 mr-0.5" />
                            {client.distanceFormatted}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 font-medium truncate flex items-center space-x-2">
                        <span>Contacto: {client.fullName}</span>
                        {client.taxId && <span>• RUC/CI: {client.taxId}</span>}
                      </div>

                      {cleanAddress(client.addressReference) && (
                        <div className="text-xs text-slate-400 truncate flex items-center">
                          <AppleMapPinIcon size={14} className="mr-1 opacity-60 shrink-0" alt="Ubicación" />
                          <span className="truncate">{cleanAddress(client.addressReference)}</span>
                        </div>
                      )}

                      {(client.currentDebt || 0) > 0 && (
                        <div className="text-xs font-bold text-red-600 flex items-center pt-0.5">
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          <span>Deuda pendiente: ${Number(client.currentDebt).toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Inline Registration Modal */}
      <ClientRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        initialCoords={userLocation || undefined}
        onClientCreated={(newClient) => {
          setIsRegisterOpen(false);
          onSelectClient(newClient);
          onClose();
        }}
      />
    </>
  );
}
