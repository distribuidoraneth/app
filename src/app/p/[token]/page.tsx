'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useDistribution } from '@/context/DistributionContext';
import { BeverageOrderPasarela } from '@/components/order/BeverageOrderPasarela';
import { CartDrawer } from '@/components/client/CartDrawer';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { ThermalReceiptModal } from '@/components/receipt/ThermalReceiptModal';
import {
  formatCurrency,
  formatDate,
  formatSmartOrderTime,
  formatOrderNumber,
  formatUnitPrice,
  formatItemTitle,
  cleanAddress,
} from '@/lib/utils/formatters';
import { Invoice, Order } from '@/types';
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
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import {
  AppleMapPinIcon,
  AppleCartIcon,
  ApplePrinterIcon,
  AppleCheckmarkSealIcon,
  AppleBanknoteIcon,
  AppleReceiptIcon,
  AppleShippingBoxIcon,
  renderFlavorThumbnail,
} from '@/components/ui/AppleIcons';

export default function ClientExperiencePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const { clients, orders, invoices, cancelOrder, cart, cartTotalJavas, cartTotalAmount } =
    useDistribution();

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'order' | 'history'>('order');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedOrderForThermal, setSelectedOrderForThermal] = useState<Order | null>(null);
  const [selectedOrderView, setSelectedOrderView] = useState<Order | null>(null);

  const rawToken = decodeURIComponent(resolvedParams.token || '').trim();
  const tokenDigits = rawToken.replace(/\D/g, '');
  const tokenLower = rawToken.toLowerCase();

  // 1. Si hay coincidencia directa por qrToken (ej. /p/1789952432-norte), va directo al local
  const exactQrMatch = clients.find((c) => c.qrToken && c.qrToken.toLowerCase() === tokenLower);

  // 2. Si no es un QR específico, buscar todos los locales registrados bajo esta Cédula/RUC o teléfono
  const matchingClients = exactQrMatch
    ? [exactQrMatch]
    : clients.filter((c) => {
        if (c.qrToken && c.qrToken.toLowerCase() === tokenLower) return true;
        if (c.taxId && c.taxId.trim().toLowerCase() === tokenLower) return true;
        if (tokenDigits.length >= 10 && c.taxId && c.taxId.replace(/\D/g, '') === tokenDigits) return true;
        if (tokenDigits.length >= 9 && c.whatsappNumber) {
          const phoneDigits = c.whatsappNumber.replace(/\D/g, '');
          if (phoneDigits === tokenDigits || phoneDigits.endsWith(tokenDigits) || tokenDigits.endsWith(phoneDigits)) {
            return true;
          }
        }
        if (c.id === rawToken) return true;
        return false;
      });

  // Si hay más de una sucursal y aún no se ha elegido ninguna, mostrar el selector
  if (matchingClients.length > 1 && !selectedBranchId) {
    const ownerName = matchingClients[0].fullName || 'Cliente Comercial';
    return (
      <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center space-y-2">
            <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUCIONES" />
            <div className="pt-2 space-y-1">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                Selecciona tu Local
              </h1>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Hola, <span className="font-bold text-slate-800">{ownerName}</span>. Tienes {matchingClients.length} locales registrados con esta identificación. ¿Para cuál deseas pedir hoy?
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {matchingClients.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedBranchId(branch.id)}
                className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all group flex items-center justify-between cursor-pointer active:scale-98 shadow-2xs"
              >
                <div className="space-y-1 pr-2">
                  <div className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                    {branch.businessName || branch.fullName}
                  </div>
                  {cleanAddress(branch.addressReference) && (
                    <div className="text-xs text-slate-500 flex items-start">
                      <AppleMapPinIcon size={13} className="mr-1 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{cleanAddress(branch.addressReference)}</span>
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-white group-hover:bg-[#0071e3] text-slate-400 group-hover:text-white flex items-center justify-center transition-all shrink-0 shadow-2xs">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-center text-slate-400 font-medium">
            Distribuidora Aneth &bull; Distribución Directa en Javas
          </p>
        </div>
      </div>
    );
  }

  const client =
    (selectedBranchId ? matchingClients.find((c) => c.id === selectedBranchId) : null) ||
    (matchingClients.length === 1 ? matchingClients[0] : null) ||
    (clients.length === 1 ? clients[0] : null) || {
      id: `cli-${rawToken}`,
      qrToken: rawToken,
      fullName: 'Cliente Comercial',
      businessName: 'Local Registrado',
      gender: 'Hombre' as const,
      whatsappNumber: '+593',
      latitude: -0.180653,
      longitude: -78.467834,
      addressReference: '',
      createdAt: new Date().toISOString(),
    };

  const clientOrders = orders.filter((o) => o.clientId === client?.id || o.whatsappNumber === client?.whatsappNumber);
  const clientInvoices = invoices.filter((i) => i.clientId === client?.id);

  // Cálculo de deuda acumulada del cliente
  const totalOrdersDebt = clientOrders.reduce(
    (sum, o) => (o.status !== 'cancelled' ? sum + (o.debtBalance || 0) : sum),
    0
  );
  const clientTotalDebt = Number(
    ((client?.currentDebt !== undefined && client.currentDebt > 0)
      ? client.currentDebt
      : totalOrdersDebt
    ).toFixed(2)
  );

  const handleOrderCancel = (orderId: string) => {
    if (confirm('¿Deseas cancelar este pedido de javas?')) {
      const success = cancelOrder(orderId);
      if (!success) {
        alert('No se pudo cancelar porque el pedido ya fue entregado.');
      } else if (selectedOrderView?.id === orderId) {
        setSelectedOrderView(null);
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
            <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUCIONES" />
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
        {/* 1. Tarjeta Independiente del Comercio con Estado de Cuenta */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
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
                      <AppleMapPinIcon size={14} className="mr-1.5 opacity-60 shrink-0" alt="Ubicación" />
                      {cleanAddress(client?.addressReference)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Estado de Cuenta sutil y limpio */}
            {clientTotalDebt > 0 ? (
              <div className="self-start sm:self-auto px-3.5 py-2 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center space-x-2 text-rose-800 shrink-0">
                <span className="text-xs font-semibold">Saldo pendiente:</span>
                <span className="font-mono font-black text-sm text-rose-700">{formatCurrency(clientTotalDebt)}</span>
              </div>
            ) : (
              <div className="self-start sm:self-auto px-3 py-1.5 bg-emerald-50 border border-emerald-200/70 rounded-2xl flex items-center space-x-1.5 text-emerald-800 shrink-0">
                <AppleCheckmarkSealIcon size={14} className="text-emerald-600" />
                <span className="text-xs font-bold">Cuenta al día</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Selector Líquido de 2 Pestañas con Tipografía Grande y Proporcionada */}
        <div className="bg-slate-200/70 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('order');
              setSelectedOrderView(null);
            }}
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
            onClick={() => {
              setActiveTab('history');
              setSelectedOrderView(null);
            }}
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

        {/* TAB 2: MIS PEDIDOS (LISTA IDÉNTICA A MÓDULO DE DESPACHOS O VISTA DE DETALLE COMPLETA) */}
        {activeTab === 'history' && (
          <>
            {/* VISTA DETALLE COMPLETA (CUANDO EL CLIENTE HACE CLIC EN UNA TARJETA) */}
            {selectedOrderView ? (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                {/* Header superior de navegación hacia atrás */}
                <div className="flex items-center justify-between pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderView(null)}
                    className="inline-flex items-center space-x-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 active:scale-95 transition-all cursor-pointer py-1 pr-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Mis Pedidos</span>
                  </button>

                  <div className="text-center">
                    <span className="text-sm font-black font-mono tracking-tight text-slate-900 block">
                      {formatOrderNumber(selectedOrderView.orderNumber)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium block">
                      {formatSmartOrderTime(selectedOrderView.createdAt)}
                    </span>
                  </div>

                  <div>
                    {selectedOrderView.status === 'cancelled' ? (
                      <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/70">
                        Cancelado
                      </span>
                    ) : selectedOrderView.status === 'delivered' ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70">
                        <AppleCheckmarkSealIcon size={14} className="mr-1 text-emerald-700" />
                        Entregado
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/70">
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
                        Por Despachar
                      </span>
                    )}
                  </div>
                </div>

                {/* Card 1: Datos del Local y Punto de Entrega */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Punto de Entrega
                    </span>
                    {client?.taxId && (
                      <span className="font-mono text-xs text-slate-400">
                        {client.taxId}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedOrderView.businessName || selectedOrderView.clientName || client?.businessName}
                    </h3>
                    {selectedOrderView.clientName && selectedOrderView.businessName !== selectedOrderView.clientName && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedOrderView.clientName}</p>
                    )}
                  </div>

                  {cleanAddress(selectedOrderView.addressReference || client?.addressReference) && (
                    <div className="flex items-start space-x-2 text-sm text-slate-600 pt-1">
                      <AppleMapPinIcon size={16} className="opacity-60 shrink-0 mt-0.5" alt="Ubicación" />
                      <span className="leading-relaxed">
                        {cleanAddress(selectedOrderView.addressReference || client?.addressReference)}
                      </span>
                    </div>
                  )}

                  {selectedOrderView.scheduledDeliveryDate && selectedOrderView.status === 'pending' && (
                    <div className="flex items-center space-x-2 text-xs text-blue-700 bg-blue-50/70 border border-blue-200/60 rounded-xl px-3 py-2">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-semibold">
                        Entrega programada: {formatDate(selectedOrderView.scheduledDeliveryDate)} {selectedOrderView.scheduledTimeSlot ? `• ${selectedOrderView.scheduledTimeSlot}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card 2: Detalle de Productos con el Mismo Desglose del Panel */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Detalle del Pedido
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-400">
                      {selectedOrderView.items.length} {selectedOrderView.items.length === 1 ? 'ítem' : 'ítems'}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {selectedOrderView.items.map((item) => {
                      const hasJavas = item.quantityJavas > 0;
                      const hasUnits = (item.quantityUnits || 0) > 0;
                      const effectivePricePerUnit = item.pricePerUnit > 0
                        ? item.pricePerUnit
                        : Number(((item.pricePerJava || 0) / (item.unitsPerJava || 12)).toFixed(4));

                      const packSubtotal = Number((item.quantityJavas * item.pricePerJava).toFixed(2));
                      const unitSubtotal = hasJavas
                        ? Number((item.subtotal - packSubtotal).toFixed(2))
                        : Number(((item.quantityUnits || 0) * effectivePricePerUnit).toFixed(2));

                      return (
                        <React.Fragment key={item.id}>
                          {/* Fila de Paquetes / Javas */}
                          {hasJavas && (
                            <div className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                              <div className="space-y-0.5 min-w-0">
                                <div className="text-sm font-bold text-slate-900 leading-snug">
                                  <span className="font-mono text-slate-500 mr-2">
                                    {item.quantityJavas}x
                                  </span>
                                  <span>
                                    {item.brand || 'Fructi'} {item.container === 'Vidrio' ? 'Java' : 'Pack'} {item.size}
                                  </span>
                                  {item.flavorType === 'single' && item.selectedFlavor && (
                                    <span className="inline-flex items-center gap-1.5 ml-1.5 align-middle">
                                      <span className="text-slate-400 font-normal">•</span>
                                      <span>{item.selectedFlavor}</span>
                                      {renderFlavorThumbnail(item.selectedFlavor, 16)}
                                    </span>
                                  )}
                                  {item.flavorType === 'surtido' && (
                                    <span className="ml-1.5 text-slate-700 font-normal">
                                      • Surtido
                                    </span>
                                  )}
                                </div>

                                {item.flavorType === 'surtido' && item.surtidoDetails && (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    <span className="text-xs text-slate-400">Sabores:</span>
                                    {Object.entries(item.surtidoDetails)
                                      .filter(([_, q]) => q > 0)
                                      .map(([fl, q]) => (
                                        <span
                                          key={fl}
                                          className="bg-slate-50 border border-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded text-xs inline-flex items-center gap-1"
                                        >
                                          <span>{q}x {fl}</span>
                                          {renderFlavorThumbnail(fl, 13)}
                                        </span>
                                      ))}
                                  </div>
                                )}

                                <p className="text-xs text-slate-400">
                                  {formatCurrency(item.pricePerJava)} c/paquete
                                </p>
                              </div>

                              <span className="font-mono font-bold text-sm text-slate-900 shrink-0">
                                {formatCurrency(packSubtotal)}
                              </span>
                            </div>
                          )}

                          {/* Fila de Unidades Sueltas */}
                          {hasUnits && (
                            <div className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                              <div className="space-y-0.5 min-w-0">
                                <div className="text-sm font-bold text-slate-900 leading-snug">
                                  <span className="font-mono text-slate-500 mr-2">
                                    {item.quantityUnits}x
                                  </span>
                                  <span>
                                    {item.brand || 'Fructi'} {item.size} {item.container}
                                  </span>
                                  {item.flavorType === 'single' && item.selectedFlavor && (
                                    <span className="inline-flex items-center gap-1.5 ml-1.5 align-middle">
                                      <span className="text-slate-400 font-normal">•</span>
                                      <span>{item.selectedFlavor}</span>
                                      {renderFlavorThumbnail(item.selectedFlavor, 16)}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-slate-400">
                                  {formatUnitPrice(effectivePricePerUnit)} c/unidad
                                </p>
                              </div>

                              <span className="font-mono font-bold text-sm text-slate-900 shrink-0">
                                {formatCurrency(unitSubtotal)}
                              </span>
                            </div>
                          )}

                          {/* Fallback */}
                          {!hasJavas && !hasUnits && (
                            <div className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="text-sm font-bold text-slate-900">
                                  <span className="font-mono text-slate-500 mr-2">{item.totalBottles || 1}x</span>
                                  {formatItemTitle(item)}
                                </div>
                                <p className="text-xs text-slate-400">
                                  {formatCurrency(item.pricePerJava)} c/paquete
                                </p>
                              </div>
                              <span className="font-mono font-bold text-sm text-slate-900 shrink-0">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Desglose Tributario SRI Ecuador (IVA 15% incluido) */}
                  {(() => {
                    const subtotal15 = Number((selectedOrderView.totalAmount / 1.15).toFixed(2));
                    const totalIva15 = Number((selectedOrderView.totalAmount - subtotal15).toFixed(2));
                    return (
                      <div className="border-t border-slate-200/80 pt-3 space-y-1.5 text-xs sm:text-sm">
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Subtotal (Base 15%):</span>
                          <span className="font-mono font-bold text-slate-800">
                            {formatCurrency(subtotal15)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>IVA (15%):</span>
                          <span className="font-mono font-bold text-slate-800">
                            {formatCurrency(totalIva15)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-base font-black border-t border-slate-200/80 pt-2 text-slate-900">
                          <span>Total a pagar:</span>
                          <span className="font-mono text-slate-900 text-lg">
                            {formatCurrency(selectedOrderView.totalAmount)}
                          </span>
                        </div>

                        {selectedOrderView.debtBalance > 0 && (
                          <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-amber-800 bg-amber-50/80 px-3.5 py-2.5 rounded-xl border border-amber-200/60 mt-2">
                            <span>Saldo pendiente:</span>
                            <span className="font-mono font-black">{formatCurrency(selectedOrderView.debtBalance)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Card 3: Comprobantes y Acciones del Cliente */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2.5">
                    Comprobantes y Acciones
                  </span>

                  {(() => {
                    const viewInvoice = clientInvoices.find(
                      (i) => i.orderId === selectedOrderView.id || i.id === selectedOrderView.invoiceId
                    );

                    return (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        {/* Botón Recibo Térmico */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForThermal(selectedOrderView)}
                          className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer border border-slate-200/80"
                        >
                          <ApplePrinterIcon size={16} className="text-slate-700" />
                          <span>Ver / Imprimir Recibo</span>
                        </button>

                        {/* Botón Factura RIDE */}
                        {viewInvoice ? (
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(viewInvoice)}
                            className="flex-1 py-3 px-4 bg-blue-50 hover:bg-blue-100 active:scale-98 text-blue-800 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer border border-blue-200/80"
                          >
                            <AppleReceiptIcon size={16} />
                            <span>Factura RIDE #{viewInvoice.invoiceNumber}</span>
                          </button>
                        ) : selectedOrderView.status === 'delivered' ? (
                          <div className="flex-1 py-3 px-4 bg-slate-50 text-slate-400 rounded-xl text-xs sm:text-sm font-medium text-center border border-slate-100">
                            Factura en proceso
                          </div>
                        ) : (
                          <div className="flex-1 py-3 px-4 bg-slate-50 text-slate-400 rounded-xl text-xs sm:text-sm font-medium text-center border border-slate-100">
                            Factura disponible al entregar
                          </div>
                        )}

                        {/* Cancelar (si está pendiente) */}
                        {selectedOrderView.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleOrderCancel(selectedOrderView.id)}
                            className="py-3 px-4 text-xs sm:text-sm text-rose-600 hover:bg-rose-50 active:scale-98 border border-rose-200 rounded-xl font-bold transition-all cursor-pointer"
                          >
                            Cancelar Pedido
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              /* VISTA DE TARJETAS IDÉNTICAS AL MÓDULO DE DESPACHOS */
              <div className="space-y-3 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Mis Pedidos
                  </h2>
                  <span className="text-xs text-slate-400 font-bold">
                    {clientOrders.length} {clientOrders.length === 1 ? 'pedido' : 'pedidos'}
                  </span>
                </div>

                {clientOrders.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                    <Package className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="font-extrabold text-slate-800 text-base">No tienes pedidos registrados</h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                      Usa la pestaña de Comprar para armar tus pedidos de bebidas con precios mayoristas.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('order');
                        setSelectedOrderView(null);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer"
                    >
                      Hacer mi Primer Pedido
                    </button>
                  </div>
                ) : (
                  clientOrders.map((order) => {
                    const orderInvoice = clientInvoices.find(
                      (i) => i.orderId === order.id || i.id === order.invoiceId
                    );
                    const isDelivered = order.status === 'delivered';
                    const isPending = order.status === 'pending';
                    const isCancelled = order.status === 'cancelled';

                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrderView(order)}
                        className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer select-none space-y-2.5"
                      >
                        {/* Header Fila 1: Número de orden y Estado (Exacto a OrderDispatchBoard) */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs sm:text-[13px] text-slate-800 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 tracking-tight select-all">
                            {formatOrderNumber(order.orderNumber)}
                          </span>

                          <div className="shrink-0">
                            {isCancelled ? (
                              <span className="inline-flex items-center text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/70 shadow-2xs">
                                Cancelado
                              </span>
                            ) : isDelivered ? (
                              <span className="inline-flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70 shadow-2xs">
                                <AppleCheckmarkSealIcon size={14} className="mr-1 text-emerald-600 shrink-0" />
                                Entregado
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
                                Por Despachar
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Centro Fila 2: Nombre de Comercio y Total (Exacto a OrderDispatchBoard) */}
                        <div className="flex items-start justify-between gap-3 pt-0.5">
                          <div className="space-y-0.5 min-w-0">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight truncate leading-snug">
                              {order.businessName || order.clientName || client?.businessName || 'Mi Pedido'}
                            </h3>
                            {cleanAddress(order.addressReference || client?.addressReference) && (
                              <p className="text-xs text-slate-500 truncate flex items-center tracking-normal">
                                <AppleMapPinIcon size={13} className="shrink-0 mr-1 opacity-50" alt="Dirección" />
                                <span className="truncate">{cleanAddress(order.addressReference || client?.addressReference)}</span>
                              </p>
                            )}
                          </div>

                          {/* Total */}
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold font-mono text-slate-900 leading-tight tracking-tight">
                              {formatCurrency(order.totalAmount)}
                            </div>
                          </div>
                        </div>

                        {/* Footer Fila 3: Saldo / Hora y Acciones Rápidas (Exacto a OrderDispatchBoard) */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
                            {order.debtBalance > 0 && (
                              <span className="inline-flex items-center text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                                Saldo: {formatCurrency(order.debtBalance)}
                              </span>
                            )}
                            <div className="flex items-center space-x-1 text-slate-400 text-[11px] sm:text-xs font-medium tracking-tight shrink-0">
                              <Clock className="w-3 h-3 text-slate-400/80 shrink-0" />
                              <span>{formatSmartOrderTime(order.createdAt)}</span>
                            </div>
                          </div>

                          {/* Micro-acciones rápidas adaptadas para el cliente con e.stopPropagation() */}
                          <div
                            className="flex items-center space-x-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Botón Recibo Térmico */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForThermal(order)}
                              className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
                              title="Ver / Imprimir Recibo"
                            >
                              <ApplePrinterIcon size={16} className="text-blue-700" />
                            </button>

                            {/* Botón Factura RIDE si existe */}
                            {orderInvoice && (
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(orderInvoice)}
                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
                                title={`Ver Factura RIDE #${orderInvoice.invoiceNumber}`}
                              >
                                <AppleReceiptIcon size={16} />
                              </button>
                            )}

                            {/* Botón Cancelar si está pendiente */}
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleOrderCancel(order.id)}
                                className="h-8 px-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/80 active:scale-95 transition-all cursor-pointer"
                                title="Cancelar este pedido"
                              >
                                Cancelar
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
          </>
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

      {/* Cart Drawer - estrictamente Preventa en Portal de Clientes */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        clientId={client?.id}
        saleType="preventa"
        isClientPortal={true}
        onOrderSuccess={() => {
          setActiveTab('history');
        }}
      />

      {/* Factura RIDE Modal (sin botón de WhatsApp para clientes) */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        showWhatsApp={false}
      />

      {/* Recibo Térmico Modal */}
      <ThermalReceiptModal
        isOpen={Boolean(selectedOrderForThermal)}
        onClose={() => setSelectedOrderForThermal(null)}
        order={selectedOrderForThermal}
        client={client}
      />
    </div>
  );
}
