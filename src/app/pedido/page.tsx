'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { BeverageOrderPasarela } from '@/components/order/BeverageOrderPasarela';
import { CartDrawer } from '@/components/client/CartDrawer';
import { ClientProximitySelectorModal } from '@/components/order/ClientProximitySelectorModal';
import { ClientRegistrationModal } from '@/components/admin/ClientRegistrationModal';
import { SaleTypeBadgeSelector } from '@/components/order/SaleTypeBadgeSelector';
import { AnethFullLogo, AnethIsotype } from '@/components/ui/AnethLogo';
import { sortClientsByProximity, calculateDistanceMeters, formatDistance, GeoCoordinates } from '@/lib/utils/geo';
import { Client, SaleType } from '@/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  ArrowLeft,
  Store,
  Navigation,
  MapPin,
  ChevronRight,
  Plus,
  Compass,
  RefreshCw,
  ExternalLink,
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
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
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

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center space-x-2 text-xs sm:text-sm font-black active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <span>Mi Pedido</span>
            {(cartTotalJavas > 0 || cartTotalUnits > 0) && (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-black rounded-full min-w-[20px] text-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {/* MODALIDAD DE VENTA */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
            Modalidad de Venta
          </span>

          <SaleTypeBadgeSelector value={saleType} onChange={setSaleType} />
        </div>

        {/* CLIENTE MÁS CERCANO (GPS) */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
              Cliente
            </span>
            <div className="flex items-center space-x-1.5">
              {isLocating && !userLocation ? (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center animate-pulse">
                  <Navigation className="w-3 h-3 mr-1 text-blue-600 shrink-0 animate-spin" />
                  Buscando local por GPS...
                </span>
              ) : formattedDistance ? (
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center">
                  <Navigation className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                  {formattedDistance}
                </span>
              ) : null}

              <button
                type="button"
                onClick={refreshGpsLocation}
                disabled={isLocating}
                title="Actualizar GPS para detectar el local más cercano"
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {activeClient ? (
            <div
              onClick={() => setIsClientModalOpen(true)}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200/90 transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:border-blue-300">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-black text-slate-900 truncate">
                      {activeClient.businessName || activeClient.fullName}
                    </h2>
                    {activeClient.clientTier === 'distribuidor' && (
                      <span className="text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">
                        Distribuidor
                      </span>
                    )}
                    {activeClient.clientTier === 'especial' && (
                      <span className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                        Especial
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate flex items-center mt-0.5">
                    <MapPin className="w-3 h-3 mr-1 shrink-0 text-slate-400" />
                    <span className="truncate">{activeClient.addressReference || 'Sin dirección registrada'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                {typeof activeClient.latitude === 'number' && typeof activeClient.longitude === 'number' && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeClient.latitude},${activeClient.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-xl transition-colors shadow-2xs flex items-center space-x-1 text-xs font-bold"
                    title="Abrir ruta en Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ruta</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsClientModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-blue-600 border border-slate-300 rounded-xl text-xs font-black transition-colors shadow-2xs cursor-pointer flex items-center space-x-1"
                >
                  <span>Cambiar</span>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
              <Store className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-700">No tienes clientes registrados aún</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Registra un cliente para asociar el despacho y la factura SRI</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs inline-flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Primer Cliente</span>
              </button>
            </div>
          )}
        </div>

        {/* CATÁLOGO DE PRODUCTOS */}
        <div className="space-y-3">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider block px-1">
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
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span>Ver Pedido</span>
              <span className="px-2.5 py-0.5 bg-blue-500/40 text-white text-xs font-bold rounded-full">
                {cartTotalBottles} {cartTotalBottles === 1 ? 'botella' : 'botellas'}
              </span>
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
