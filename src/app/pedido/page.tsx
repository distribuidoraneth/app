'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { BeverageOrderPasarela } from '@/components/order/BeverageOrderPasarela';
import { CartDrawer } from '@/components/client/CartDrawer';
import { ClientProximitySelectorModal } from '@/components/order/ClientProximitySelectorModal';
import { ClientRegistrationModal } from '@/components/admin/ClientRegistrationModal';
import { AnethFullLogo, AnethIsotype } from '@/components/ui/AnethLogo';
import { sortClientsByProximity, calculateDistanceMeters, formatDistance, GeoCoordinates } from '@/lib/utils/geo';
import { Client, SaleType } from '@/types';
import { cleanAddress } from '@/lib/utils/formatters';
import { AppleMapPinIcon, AppleStorefrontIcon, AppleCartIcon } from '@/components/ui/AppleIcons';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  Plus,
} from 'lucide-react';

function StandaloneOrderContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as SaleType) || 'autoventa';

  const {
    clients,
    selectedClientId,
    setSelectedClientId,
    cart,
    cartTotalJavas,
    cartTotalUnits,
    cartTotalBottles,
    cartTotalAmount,
  } = useDistribution();

  const [saleType, setSaleType] = useState<SaleType>(initialType);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<GeoCoordinates | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);

  // Sync mode and client from URL
  useEffect(() => {
    const typeFromUrl = searchParams.get('type') as SaleType;
    if (typeFromUrl === 'autoventa' || typeFromUrl === 'preventa') {
      setSaleType(typeFromUrl);
    }
    const clientFromUrl = searchParams.get('client');
    if (clientFromUrl) {
      setManualClientId(clientFromUrl);
      setSelectedClientId(clientFromUrl);
    }
  }, [searchParams, setSelectedClientId]);

  // User manual selection override: only when user clicks "Cambiar" or registers new client
  const [manualClientId, setManualClientId] = useState<string | null>(null);

  // Request GPS position & Automatically select nearest client
  const refreshGpsLocation = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setUserLocation(coords);
          setIsLocating(false);
        },
        (err) => {
          console.warn('GPS location error:', err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    refreshGpsLocation();
  }, [refreshGpsLocation]);

  // Nearest client calculation dynamically based on live GPS
  const nearestClient: Client | null = useMemo(() => {
    if (!clients || clients.length === 0) return null;
    if (userLocation) {
      const sorted = sortClientsByProximity(clients, userLocation);
      return sorted[0] || clients[0];
    }
    return clients[0];
  }, [clients, userLocation]);

  // Current active client: User manual choice takes precedence; otherwise ALWAYS nearest client
  const activeClient: Client | null = useMemo(() => {
    if (manualClientId) {
      const found = clients.find((c) => c.id === manualClientId);
      if (found) return found;
    }
    return nearestClient;
  }, [clients, manualClientId, nearestClient]);

  // Keep DistributionContext selectedClientId in sync with activeClient
  useEffect(() => {
    if (activeClient?.id && activeClient.id !== selectedClientId) {
      setSelectedClientId(activeClient.id);
    }
  }, [activeClient, selectedClientId, setSelectedClientId]);

  // Formatted distance to current active client
  const formattedDistance = useMemo(() => {
    if (!activeClient || !userLocation || typeof activeClient.latitude !== 'number' || typeof activeClient.longitude !== 'number') {
      return null;
    }
    const meters = calculateDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      activeClient.latitude,
      activeClient.longitude
    );
    return formatDistance(meters);
  }, [activeClient, userLocation]);

  const handleSelectClient = (client: Client) => {
    setManualClientId(client.id);
    setSelectedClientId(client.id);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 pb-28 font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between relative">
          <div className="flex items-center space-x-2.5 sm:space-x-3 z-10">
            <Link
              href="/admin"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Volver al Panel"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="hidden sm:block">
              <AnethFullLogo size="sm" showSubtitle={false} />
            </div>
            <div className="sm:hidden">
              <AnethIsotype size="sm" variant="color" />
            </div>
          </div>

          {/* Centro: Título de Modalidad en Azul Centrado */}
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-center">
            <h1 className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight select-none">
              {saleType === 'preventa' ? 'Preventa' : 'Autoventa'}
            </h1>
          </div>

          <div className="z-10">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative px-4 sm:px-4.5 py-2 sm:py-2.5 bg-slate-950 hover:bg-slate-900 active:scale-95 text-white rounded-xl shadow-xs border border-slate-800/80 transition-all flex items-center gap-3 text-sm sm:text-[15px] font-black cursor-pointer select-none group"
            >
              <div className="relative flex items-center justify-center mr-0.5">
                <AppleCartIcon size={19} className="text-white shrink-0 group-hover:scale-105 transition-transform" />
                {(cartTotalJavas > 0 || cartTotalUnits > 0) && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 shadow-xs tabular-nums animate-in zoom-in-75 duration-150">
                    {cart.length}
                  </span>
                )}
              </div>
              <span className="tracking-tight">Pedido</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {/* CLIENTE (Sin tarjetas anidadas, limpio, con Storefront y flecha dropdown para máximo espacio) */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {activeClient ? (
            <div
              onClick={() => setIsClientModalOpen(true)}
              className="flex items-center justify-between gap-2.5 cursor-pointer group select-none"
              title="Toca para buscar o cambiar cliente"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Ícono de tienda oficial sin recuadro */}
                <AppleStorefrontIcon size={26} className="text-blue-600 shrink-0 group-hover:scale-105 transition-transform" alt="Tienda" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                    <h2 className="text-sm sm:text-base font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {activeClient.businessName || activeClient.fullName}
                    </h2>
                    {activeClient.clientTier === 'distribuidor' && (
                      <span className="text-[10px] sm:text-xs font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">
                        Distribuidor
                      </span>
                    )}
                    {activeClient.clientTier === 'especial' && (
                      <span className="text-[10px] sm:text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                        Especial
                      </span>
                    )}
                  </div>

                  {cleanAddress(activeClient.addressReference) && (
                    <div className="mt-0.5">
                      {activeClient.latitude && activeClient.longitude ? (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${activeClient.latitude},${activeClient.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center truncate max-w-full group/addr"
                          title="Abrir ruta en Google Maps"
                        >
                          <AppleMapPinIcon size={13} className="mr-1 shrink-0 opacity-60 group-hover/addr:opacity-100 group-hover/addr:text-blue-600 transition-all" alt="Ubicación" />
                          <span className="truncate group-hover/addr:underline">{cleanAddress(activeClient.addressReference)}</span>
                        </a>
                      ) : (
                        <p className="text-xs text-slate-500 truncate flex items-center">
                          <AppleMapPinIcon size={13} className="mr-1 shrink-0 opacity-60" alt="Ubicación" />
                          <span className="truncate">{cleanAddress(activeClient.addressReference)}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Lado derecho: Flecha dropdown limpia */}
              <div className="p-1.5 rounded-xl text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all shrink-0">
                <ChevronDown className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
              </div>
            </div>
          ) : (
            <div className="p-4 text-center space-y-2">
              <AppleStorefrontIcon size={24} className="text-slate-400 mx-auto" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-700">No tienes clientes registrados aún</p>
                <p className="text-xs text-slate-500">Registra un cliente para asociar el despacho</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs inline-flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Primer Cliente</span>
              </button>
            </div>
          )}
        </div>

        {/* CATÁLOGO DE PRODUCTOS */}
        <div className="space-y-3">
          <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider block px-1">
            Catálogo de Bebidas
          </span>
          <BeverageOrderPasarela />
        </div>
      </main>

      {/* Floating Bottom Review Button for Mobile with iOS Safe-Area support */}
      {(cartTotalJavas > 0 || cartTotalUnits > 0) && (
        <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 sm:hidden">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-sm shadow-2xl flex items-center justify-between active:scale-97 transition-transform duration-150 ease-out cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <AppleCartIcon size={20} className="text-white shrink-0" />
              <span className="tracking-tight font-black">Ver Pedido</span>
            </div>
            <span className="font-mono text-base font-black">${cartTotalAmount.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        clientId={activeClient?.id}
        saleType={saleType}
      />

      {/* Client Proximity Modal */}
      <ClientProximitySelectorModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        selectedClientId={activeClient?.id}
        onSelectClient={handleSelectClient}
      />

      {/* Inline Registration Modal if no clients */}
      <ClientRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        initialCoords={userLocation || undefined}
        onClientCreated={(newClient) => {
          setIsRegisterModalOpen(false);
          setSelectedClientId(newClient.id);
        }}
      />
    </div>
  );
}

export default function StandaloneOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-500">Cargando venta...</div>}>
      <StandaloneOrderContent />
    </Suspense>
  );
}
