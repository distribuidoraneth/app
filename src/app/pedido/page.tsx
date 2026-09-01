'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { BeverageOrderPasarela } from '@/components/order/BeverageOrderPasarela';
import { CartDrawer } from '@/components/client/CartDrawer';
import { ClientProximitySelectorModal } from '@/components/order/ClientProximitySelectorModal';
import { SaleTypeBadgeSelector } from '@/components/order/SaleTypeBadgeSelector';
import { AnethFullLogo, AnethIsotype } from '@/components/ui/AnethLogo';
import { Client, SaleType } from '@/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Package,
  ShoppingBag,
  ArrowLeft,
  Store,
  Navigation,
  Sparkles,
  MapPin,
  ChevronRight,
  Plus,
  Zap,
  Calendar,
  Layers,
} from 'lucide-react';

function StandaloneOrderContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as SaleType) || 'autoventa';

  const {
    clients,
    selectedClientId,
    setSelectedClientId,
    cartTotalJavas,
    cartTotalBottles,
    cartTotalAmount,
  } = useDistribution();

  const [saleType, setSaleType] = useState<SaleType>(initialType);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const typeFromUrl = searchParams.get('type') as SaleType;
    if (typeFromUrl === 'autoventa' || typeFromUrl === 'preventa') {
      setSaleType(typeFromUrl);
    }
  }, [searchParams]);

  const activeClient = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'mostrador',
    qrToken: 'mostrador-directo',
    fullName: 'Venta Directa / Mostrador',
    businessName: 'Venta Inmediata',
    gender: 'Hombre' as const,
    whatsappNumber: '+593',
    latitude: -1.24908,
    longitude: -78.61675,
    addressReference: 'Mostrador Central',
    createdAt: new Date().toISOString(),
  };

  const handleSelectClient = (client: Client) => {
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
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow transition-colors flex items-center space-x-2 text-xs sm:text-sm font-black active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <span>Mi Pedido ({cartTotalJavas} javas)</span>
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

        {/* CLIENTE */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
            Cliente
          </span>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-slate-900 truncate">
                  {activeClient?.businessName || activeClient?.fullName}
                </h2>
                <p className="text-[11px] text-slate-500 truncate flex items-center">
                  <MapPin className="w-3 h-3 mr-1 shrink-0 text-slate-400" />
                  <span className="truncate">{activeClient?.addressReference || 'Sin dirección'}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsClientModalOpen(true)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-blue-600 border border-slate-300 rounded-xl text-xs font-black transition-colors self-end sm:self-auto shrink-0 shadow-2xs cursor-pointer"
            >
              Cambiar Cliente
            </button>
          </div>
        </div>

        {/* CATÁLOGO DE PRODUCTOS */}
        <div className="space-y-3">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider block px-1">
            Catálogo de Bebidas
          </span>
          <BeverageOrderPasarela />
        </div>
      </main>

      {/* Floating Bottom Review Button for Mobile */}
      {cartTotalJavas > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 sm:hidden">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-sm shadow-xl flex items-center justify-between active:scale-95 transition-all"
          >
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span>Ver Pedido ({cartTotalBottles} botellas)</span>
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
