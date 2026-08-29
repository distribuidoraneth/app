'use client';

import React, { useState } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { BeverageOrderPasarela } from '@/components/order/BeverageOrderPasarela';
import { CartDrawer } from '@/components/client/CartDrawer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ShoppingBag, ArrowLeft, Store, Sparkles } from 'lucide-react';

export default function StandaloneOrderPage() {
  const router = useRouter();
  const {
    clients,
    selectedClientId,
    setSelectedClientId,
    cartTotalJavas,
    cartTotalAmount,
  } = useDistribution();

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const activeClient = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'mostrador',
    qrToken: 'mostrador-directo',
    fullName: 'Venta Directa / Mostrador',
    businessName: 'Venta Inmediata',
    gender: 'Hombre' as const,
    whatsappNumber: '+593',
    latitude: -0.180653,
    longitude: -78.467834,
    addressReference: 'Mostrador Central',
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[10px] font-bold bg-blue-50 text-google-blue px-2 py-0.5 rounded border border-blue-200">
                Toma de Pedido de Javas
              </span>
              <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                DISTRIBUIDORA ANETH
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow transition-colors flex items-center space-x-1.5 text-xs font-bold"
          >
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <span>Revisar ({cartTotalJavas} javas)</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Client selector banner */}
        <div className="bg-white p-4 rounded-liquid border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-google-blue flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Cliente / Destinatario del Pedido
              </span>
              <span className="text-sm font-bold text-slate-900">
                {activeClient?.fullName} ({activeClient?.businessName || 'Local'})
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Cambiar cliente:</span>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 focus:ring-2 focus:ring-google-blue"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.businessName || 'Local'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pasarela Wizard */}
        <BeverageOrderPasarela onGoToCheckout={() => setIsCartOpen(true)} />
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={(orderId) => {
          alert('Pedido registrado con éxito en el sistema.');
          router.push('/admin');
        }}
      />
    </div>
  );
}
