'use client';

import React, { useState } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { BeverageOrderPasarela } from '@/components/order/BeverageOrderPasarela';
import { CartDrawer } from '@/components/client/CartDrawer';
import { ClientProximitySelectorModal } from '@/components/order/ClientProximitySelectorModal';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { Client } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';

export default function StandaloneOrderPage() {
  const router = useRouter();
  const {
    clients,
    selectedClientId,
    setSelectedClientId,
    cartTotalJavas,
    cartTotalBottles,
    cartTotalAmount,
  } = useDistribution();

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);

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
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Volver al Panel"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <AnethFullLogo size="sm" showSubtitle={false} />
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

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* CLIENT PROXIMITY & SELECTION CARD */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Cliente Seleccionado
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate mt-0.5">
                {activeClient?.businessName || activeClient?.fullName}
              </h2>
              <p className="text-[11px] text-slate-500 truncate flex items-center">
                <MapPin className="w-3 h-3 mr-1 shrink-0 text-slate-400" />
                <span className="truncate">{activeClient?.addressReference || 'Sin dirección registrada'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsClientModalOpen(true)}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-900 rounded-xl text-xs font-black border border-slate-300 flex items-center justify-center space-x-1.5 transition-all shrink-0"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Cambiar Local (GPS / Buscar)</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Pasarela de Bebidas */}
        <BeverageOrderPasarela />
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
