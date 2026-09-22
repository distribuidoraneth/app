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
  ChevronDown,
  Calendar,
} from 'lucide-react';
import {
  AppleMapPinIcon,
  AppleCartIcon,
  ApplePrinterIcon,
  AppleCheckmarkSealIcon,
  AppleBanknoteIcon,
  AppleReceiptIcon,
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
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

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
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-3">
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
          </div>

          {/* Saldo / Estado Financiero del Cliente */}
          {clientTotalDebt > 0 ? (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3.5 bg-rose-50/80 border border-rose-200/80 rounded-2xl">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <AppleBanknoteIcon size={18} />
                </div>
                <div>
                  <span className="text-xs font-black text-rose-950 block leading-tight">
                    Saldo Pendiente de Pago
                  </span>
                  <span className="text-[11px] text-rose-700 font-medium">
                    Tienes valores pendientes por liquidar a tu repartidor
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg sm:text-xl font-black font-mono text-rose-700 tabular-nums">
                  {formatCurrency(clientTotalDebt)}
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-950 block leading-tight">
                    Cuenta al Día
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    No registras deudas pendientes
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200/60 shadow-2xs">
                $0.00
              </span>
            </div>
          )}
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

        {/* TAB 2: MIS PEDIDOS (NUEVAS TARJETAS MODERNAS RESUMIDAS) */}
        {activeTab === 'history' && (
          <div className="space-y-3">
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
                  Usa la pestaña de Comprar para armar tus javas de bebidas con precio mayorista.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('order')}
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
                const isExpanded = !!expandedOrders[order.id];

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Header Fila 1: Número de orden, fecha y Estado */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs sm:text-[13px] text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80 tracking-tight select-all">
                          {formatOrderNumber(order.orderNumber)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium sm:hidden">
                          {formatSmartOrderTime(order.createdAt)}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {order.status === 'pending' && (
                          <span className="inline-flex items-center text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/70 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
                            Preventa • Por Despachar
                          </span>
                        )}
                        {order.status === 'delivered' && (
                          <span className="inline-flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70 shadow-2xs">
                            <AppleCheckmarkSealIcon size={14} className="mr-1 text-emerald-600 shrink-0" />
                            Entregado
                          </span>
                        )}
                        {order.status === 'cancelled' && (
                          <span className="inline-flex items-center text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/70 shadow-2xs">
                            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600 shrink-0" />
                            Cancelado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Centro Fila 2: Resumen del Pedido, Saldo y Total */}
                    <div className="flex items-start justify-between gap-3 pt-0.5">
                      <div className="space-y-1 min-w-0">
                        {/* Resumen de cantidades */}
                        <div className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 flex-wrap">
                          <span>
                            {order.totalJavas > 0 && `${order.totalJavas} ${order.totalJavas === 1 ? 'paq' : 'paqs'}`}
                            {order.totalJavas > 0 && (order.totalUnits || 0) > 0 && ' + '}
                            {(order.totalUnits || 0) > 0 && `${order.totalUnits} ${(order.totalUnits || 0) === 1 ? 'und' : 'unds'}`}
                            {order.totalJavas === 0 && (order.totalUnits || 0) === 0 && `${order.totalBottles || order.items.length} bots`}
                          </span>
                          <span className="text-xs font-normal text-slate-400">
                            • {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>

                        {/* Indicador de Pago y Saldo Deudor de la Orden */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.debtBalance > 0 ? (
                            <span className="inline-flex items-center text-[11px] sm:text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/70">
                              Saldo pendiente: {formatCurrency(order.debtBalance)}
                            </span>
                          ) : order.status === 'delivered' ? (
                            <span className="inline-flex items-center text-[11px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                              Pagado completo
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] sm:text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                              Por cobrar al entregar
                            </span>
                          )}

                          {order.amountPaid > 0 && order.debtBalance > 0 && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              (Abonado: {formatCurrency(order.amountPaid)})
                            </span>
                          )}
                        </div>

                        {order.scheduledDeliveryDate && order.status === 'pending' && (
                          <div className="text-[11px] sm:text-xs text-slate-500 font-medium flex items-center gap-1 pt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Entrega: {formatDate(order.scheduledDeliveryDate)} {order.scheduledTimeSlot ? `• ${order.scheduledTimeSlot}` : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Total */}
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total</span>
                        <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 leading-tight tracking-tight">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Desplegable: Ver / Ocultar Detalle */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => toggleOrderExpand(order.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 active:scale-98 flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <span>{isExpanded ? 'Ocultar detalle de productos' : 'Ver detalle de productos'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 space-y-2 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
                          {order.items.map((it) => (
                            <div
                              key={it.id}
                              className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-slate-900 truncate">
                                  {it.quantityJavas > 0 && `${it.quantityJavas}x Java `}
                                  {it.quantityUnits > 0 && `${it.quantityUnits}x Und `}
                                  <span className="font-semibold text-slate-700">
                                    {it.brand || 'Fructi'} {it.beverageType} • {it.size} {it.container}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {it.flavorType === 'single'
                                    ? `Sabor: ${it.selectedFlavor}`
                                    : `Surtido: ${it.surtidoDetails && Object.entries(it.surtidoDetails).map(([f, q]) => `${q} ${f}`).join(', ')}`}
                                </div>
                              </div>
                              <span className="font-mono font-bold text-slate-800 shrink-0">
                                {formatCurrency(it.subtotal)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Fila 3: Acciones permitidas al cliente (Recibo, Factura RIDE, Cancelar) - SIN WHATSAPP */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100/80">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                        {/* Botón Recibo */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForThermal(order)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
                          title="Ver o imprimir recibo"
                        >
                          <ApplePrinterIcon size={14} className="text-slate-600" />
                          <span>Recibo</span>
                        </button>

                        {/* Botón Factura RIDE */}
                        {orderInvoice ? (
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(orderInvoice)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-800 border border-blue-200/80 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
                            title="Ver factura electrónica RIDE"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Factura RIDE #{orderInvoice.invoiceNumber}</span>
                          </button>
                        ) : order.status === 'delivered' ? (
                          <span className="text-xs text-slate-400 font-medium">
                            Factura en proceso
                          </span>
                        ) : (
                          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                            Factura disponible al entregar
                          </span>
                        )}
                      </div>

                      {/* Botón Cancelar (solo pedidos pendientes) */}
                      {order.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleOrderCancel(order.id)}
                          className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 active:scale-95 border border-rose-200 rounded-xl font-bold transition-all cursor-pointer"
                        >
                          Cancelar Pedido
                        </button>
                      )}
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
