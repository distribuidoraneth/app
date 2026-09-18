'use client';

import React, { useState, use } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { BeverageOrderPasarela } from '@/components/order/BeverageOrderPasarela';
import { CartDrawer } from '@/components/client/CartDrawer';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { formatCurrency, formatDate, cleanAddress } from '@/lib/utils/formatters';
import { Invoice } from '@/types';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { MobileTestButton } from '@/components/ui/MobileTestQRModal';
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  User,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AppleMapPinIcon, AppleCartIcon } from '@/components/ui/AppleIcons';

export default function ClientExperiencePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const { clients, orders, invoices, cancelOrder, cart, cartTotalJavas, cartTotalAmount } =
    useDistribution();

  // Match client by QR token
  const client =
    clients.find((c) => c.qrToken === resolvedParams.token) ||
    clients[0] || {
      id: `cli-${resolvedParams.token}`,
      qrToken: resolvedParams.token,
      fullName: 'Cliente Comercial',
      businessName: 'Local Registrado',
      gender: 'Hombre' as const,
      whatsappNumber: '+593',
      latitude: -0.180653,
      longitude: -78.467834,
      addressReference: '',
      createdAt: new Date().toISOString(),
    };

  const [activeTab, setActiveTab] = useState<'order' | 'history'>('order');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  const clientOrders = orders.filter((o) => o.clientId === client?.id || o.whatsappNumber === client?.whatsappNumber);
  const clientInvoices = invoices.filter((i) => i.clientId === client?.id);

  const handleOrderCancel = (orderId: string) => {
    if (confirm('¿Deseas cancelar este pedido de javas?')) {
      const success = cancelOrder(orderId);
      if (!success) {
        alert('No se pudo cancelar porque el pedido ya fue entregado.');
      }
    }
  };

  const businessTitle = client?.businessName || client?.fullName || 'Local Comercial';
  const pendingOrdersCount = clientOrders.filter((o) => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-28 font-sans">
      {/* Top Navbar - Clean & Ultra-refinado */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUIDORA" />
          </div>

          <div className="flex items-center space-x-2">
            {/* Oculto en celulares para no saturar la cabecera */}
            <div className="hidden md:flex">
              <MobileTestButton />
            </div>

            {/* Botón Pedido - Acabado Limpio Blanco y Negro con insignia en el ícono */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative px-3.5 sm:px-4 py-2 bg-slate-950 hover:bg-slate-900 active:scale-95 text-white rounded-xl shadow-xs border border-slate-800/80 transition-all flex items-center gap-2 text-xs sm:text-sm font-black cursor-pointer select-none group"
            >
              <div className="relative flex items-center justify-center">
                <AppleCartIcon size={18} className="text-white shrink-0 group-hover:scale-105 transition-transform" />
                {cartTotalJavas > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 shadow-xs tabular-nums animate-in zoom-in-75 duration-150">
                    {cart.length}
                  </span>
                )}
              </div>
              <span className="tracking-tight">Pedido</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        {/* 1. Tarjeta Independiente del Comercio */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {businessTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="flex items-center font-bold text-slate-800">
              <User className="w-4 h-4 mr-1.5 text-slate-400" />
              {client?.fullName}
            </span>
            {cleanAddress(client?.addressReference) && (
              <>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="flex items-center font-medium text-slate-500">
                  <AppleMapPinIcon size={14} className="mr-1.5 opacity-60 flex-shrink-0" alt="Ubicación" />
                  {cleanAddress(client?.addressReference)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 2. Selector Líquido de 2 Pestañas con Tipografía Grande y Proporcionada */}
        <div className="bg-slate-200/70 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className={`flex-1 py-3.5 px-5 rounded-xl text-base sm:text-lg font-black transition-all flex items-center justify-center space-x-2 active:scale-95 ${
              activeTab === 'order'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Comprar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3.5 px-5 rounded-xl text-base sm:text-lg font-black transition-all flex items-center justify-center space-x-2 active:scale-95 ${
              activeTab === 'history'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Mis Pedidos</span>
            {pendingOrdersCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-mono font-black">
                {pendingOrdersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Experience Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        {/* TAB 1: JAVAS PASARELA INTERACTIVA */}
        {activeTab === 'order' && (
          <BeverageOrderPasarela
            onGoToCheckout={() => setIsCartOpen(true)}
          />
        )}

        {/* TAB 2: MIS PEDIDOS (CON FACTURA INTEGRADA EN CADA PEDIDO) */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Historial y Estado de Pedidos
            </h2>

            {clientOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-extrabold text-slate-800 text-base">No tienes pedidos registrados</h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Usa la pestaña de pedidos para armar tus javas de bebidas.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('order')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-black text-xs transition-all shadow-xs"
                >
                  Hacer mi Primer Pedido
                </button>
              </div>
            ) : (
              clientOrders.map((order) => {
                const orderInvoice = clientInvoices.find(
                  (i) => i.orderId === order.id || i.id === order.invoiceId
                );

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          #{order.orderNumber}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-medium">{formatDate(order.createdAt)}</span>
                      </div>

                      <div>
                        {order.status === 'pending' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                            Por Despachar
                          </span>
                        )}
                        {order.status === 'delivered' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            Entregado
                          </span>
                        )}
                        {order.status === 'cancelled' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900">
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Cancelado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 text-xs sm:text-sm">
                      {order.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl"
                        >
                          <div>
                            <span className="font-black text-slate-900">
                              {it.quantityJavas}x Java
                            </span>{' '}
                            <span className="font-bold text-slate-800">
                              {it.beverageType} • {it.size} {it.container}
                            </span>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {it.flavorType === 'single'
                                ? `Sabor: ${it.selectedFlavor}`
                                : `Surtido: ${
                                    it.surtidoDetails &&
                                    Object.entries(it.surtidoDetails)
                                      .map(([f, q]) => `${q} ${f}`)
                                      .join(', ')
                                  }`}
                            </div>
                          </div>
                          <span className="font-mono font-black text-slate-900 text-sm sm:text-base">
                            {formatCurrency(it.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-xs text-slate-500 font-bold block">
                          Total {order.totalJavas} javas
                        </span>
                        <span className="text-lg sm:text-xl font-black font-mono text-blue-700">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {orderInvoice ? (
                          <button
                            type="button"
                            onClick={() => setActiveInvoice(orderInvoice)}
                            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-800 border border-blue-200 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Factura #{orderInvoice.invoiceNumber}</span>
                          </button>
                        ) : order.status === 'delivered' ? (
                          <span className="text-xs text-slate-400 font-medium">
                            Factura en proceso
                          </span>
                        ) : null}

                        {order.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleOrderCancel(order.id)}
                            className="px-3.5 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 active:scale-95 border border-red-200 rounded-xl font-bold transition-all cursor-pointer"
                          >
                            Cancelar Pedido
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Píldora Flotante Despegada del Borde (Sin chocar con menús del celular) */}
      {cartTotalJavas > 0 && (
        <div className="fixed bottom-5 sm:bottom-6 left-4 right-4 max-w-lg mx-auto z-40 bg-slate-950 text-white rounded-3xl p-3 sm:p-3.5 shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-6 duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 pl-1">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-mono font-black text-sm shadow-xs">
                {cartTotalJavas}
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block">
                  {cartTotalJavas} {cartTotalJavas === 1 ? 'Java en pedido' : 'Javas en pedido'}
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-white">
                  {formatCurrency(cartTotalAmount)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="py-3 px-5 sm:px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
            >
              <span>Finalizar Pedido</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        clientId={client?.id}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        invoice={activeInvoice}
        isOpen={!!activeInvoice}
        onClose={() => setActiveInvoice(null)}
      />
    </div>
  );
}
