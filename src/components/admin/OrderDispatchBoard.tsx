'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDistribution } from '@/context/DistributionContext';
import {
  formatCurrency,
  formatDate,
  formatOrderNumber,
  formatSmartOrderTime,
  generateWhatsAppOrderLink,
  formatItemTitle,
  getGoogleMapsNavigationUrl,
  cleanAddress,
} from '@/lib/utils/formatters';
import { Order, Invoice } from '@/types';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { ThermalReceiptModal } from '@/components/receipt/ThermalReceiptModal';
import { AppleMapPinIcon, AppleWhatsAppIcon, AppleCheckmarkSealIcon, AppleShippingBoxIcon, AppleCalendarIcon, ApplePrinterIcon } from '@/components/ui/AppleIcons';
import {
  Clock,
  XCircle,
  FileText,
  Package,
  Phone,
  Check,
  Printer,
  Search,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export function OrderDispatchBoard() {
  const router = useRouter();
  const {
    orders,
    invoices,
    clients,
    generateInvoice,
    updateOrderStatus,
    loadOrders,
    ordersFilter,
    isOrdersLoading,
  } = useDistribution();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedOrderForThermal, setSelectedOrderForThermal] = useState<Order | null>(null);

  // Estados de búsqueda y selector de fecha
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDatePreset, setSelectedDatePreset] = useState<'today' | 'yesterday' | 'week' | 'all' | 'custom'>(
    ordersFilter?.datePreset || 'today'
  );
  const [customDate, setCustomDate] = useState<string>('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    }
  };

  const handleSelectPreset = (preset: 'today' | 'yesterday' | 'week' | 'all') => {
    setSelectedDatePreset(preset);
    setCustomDate('');
    setSearchQuery('');
    loadOrders({ datePreset: preset });
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      loadOrders({ searchQuery: searchQuery.trim() });
    } else {
      loadOrders({ datePreset: selectedDatePreset, customDate });
    }
  };

  const filteredOrders = orders.filter((o) => {
    // 1. Filtro de estado
    if (statusFilter === 'pending' && o.status !== 'pending') return false;
    if (statusFilter === 'delivered' && o.status !== 'delivered') return false;
    if (statusFilter === 'cancelled' && o.status !== 'cancelled') return false;

    // 2. Filtro instantáneo local por texto si el usuario escribe
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchBusiness = (o.businessName || '').toLowerCase().includes(q);
      const matchClient = (o.clientName || '').toLowerCase().includes(q);
      const matchNumber = (o.orderNumber || '').toLowerCase().includes(q);
      const matchPhone = (o.whatsappNumber || '').includes(q);
      if (!matchBusiness && !matchClient && !matchNumber && !matchPhone) {
        return false;
      }
      return true;
    }

    // 3. Filtro local por fecha (garantiza que al cambiar entre Hoy, Ayer, etc. la vista sea precisa e inmediata)
    if (o.createdAt) {
      const orderDate = new Date(o.createdAt);
      const now = new Date();

      if (selectedDatePreset === 'today') {
        // En "Hoy": mostrar si fue creado hoy O si sigue pendiente de despacho
        const isToday =
          orderDate.getFullYear() === now.getFullYear() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getDate() === now.getDate();
        if (!isToday && o.status !== 'pending') {
          return false;
        }
      } else if (selectedDatePreset === 'yesterday') {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        const isYesterday =
          orderDate.getFullYear() === yest.getFullYear() &&
          orderDate.getMonth() === yest.getMonth() &&
          orderDate.getDate() === yest.getDate();
        if (!isYesterday) {
          return false;
        }
      } else if (selectedDatePreset === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        if (orderDate < weekAgo) {
          return false;
        }
      } else if (selectedDatePreset === 'custom' && customDate) {
        const parts = customDate.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const isCustom =
            orderDate.getFullYear() === year &&
            orderDate.getMonth() === month &&
            orderDate.getDate() === day;
          if (!isCustom) {
            return false;
          }
        }
      }
    } else if (selectedDatePreset === 'yesterday') {
      return false;
    }

    return true;
  });

  const handleGenerateInvoice = (order: Order) => {
    const inv = generateInvoice(order.id);
    if (inv) {
      setSelectedInvoice(inv);
    }
  };

  const handleShareWhatsApp = (order: Order) => {
    const inv = invoices.find((i) => i.orderId === order.id || i.id === order.invoiceId);

    let targetPhone = order.whatsappNumber?.trim();
    if (!targetPhone) {
      const input = window.prompt(
        'El pedido no tiene teléfono guardado.\n\n• Ingrese un número para enviárselo directamente, o\n• Presione "Aceptar" para elegir a cualquier contacto en su WhatsApp:',
        ''
      );
      if (input === null) return;
      targetPhone = input.trim();
    }

    const link = generateWhatsAppOrderLink({
      phone: targetPhone,
      clientName: order.clientName,
      orderNumber: order.orderNumber,
      total: order.totalAmount,
      invoiceNumber: inv?.invoiceNumber || order.invoiceNumber,
    });
    window.open(link, '_blank');
  };

  const handleOpenNavigation = (lat: number, lng: number) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Barra de Búsqueda y Filtros de Fecha */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-3 sm:p-4 shadow-xs space-y-2.5">
        {/* Fila 1: Input de Búsqueda por Comercio / Cliente / # Pedido */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit();
              }}
              placeholder="Buscar por comercio, cliente o # de pedido..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadOrders({ datePreset: selectedDatePreset, customDate });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSearchSubmit}
            disabled={isOrdersLoading}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
          >
            {isOrdersLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Buscar</span>
            )}
          </button>
        </div>

        {/* Fila 2: Filtros de Fecha Equilibrados al 100% de Ancho (4 Columnas) */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleSelectPreset('today')}
            className={`w-full py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer text-center flex items-center justify-center ${
              selectedDatePreset === 'today' && !searchQuery
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('yesterday')}
            className={`w-full py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center ${
              selectedDatePreset === 'yesterday' && !searchQuery
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Ayer
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('week')}
            className={`w-full py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center ${
              selectedDatePreset === 'week' && !searchQuery
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="hidden sm:inline">Esta&nbsp;</span>Semana
          </button>

          {/* Selector de Fecha Nativo Equilibrado */}
          <div className="relative w-full">
            <button
              type="button"
              onClick={openDatePicker}
              className={`w-full py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 sm:space-x-1.5 transition-all cursor-pointer text-center ${
                selectedDatePreset === 'custom' && customDate
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {!customDate && <AppleCalendarIcon size={14} className="shrink-0 pointer-events-none" />}
              <span className={`font-mono text-center tracking-tight pointer-events-none ${customDate ? 'text-[11px] sm:text-xs font-bold' : 'text-xs font-bold'}`}>
                {customDate
                  ? (() => {
                      const parts = customDate.split('-');
                      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : customDate;
                    })()
                  : 'Fecha'}
              </span>
            </button>

            <input
              ref={dateInputRef}
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                if (e.target.value) {
                  setSelectedDatePreset('custom');
                  setSearchQuery('');
                  loadOrders({ datePreset: 'custom', customDate: e.target.value });
                }
              }}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Liquid Material Filter Pill (Full Width, Balanced & Neutral) */}
      <div className="w-full">
        <div
          role="tablist"
          className="w-full grid grid-cols-4 p-1.5 bg-slate-200/80 border border-white/90 backdrop-blur-2xl rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
        >
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: 'Por Despachar' },
              { id: 'delivered', label: 'Entregados' },
              { id: 'cancelled', label: 'Cancelados' },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setStatusFilter(tab.id)}
                className={`relative z-10 flex items-center justify-center py-2 px-2 sm:px-4 rounded-full transition-colors duration-200 outline-none select-none cursor-pointer text-center text-xs sm:text-[13px] font-black ${
                  isActive
                    ? 'text-slate-900'
                    : 'text-slate-500 hover:text-slate-800 font-bold'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="order-filter-pill"
                    className="absolute inset-0 bg-white shadow-[0_3px_12px_rgba(0,0,0,0.1)] border border-slate-200/80 rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List: Compact Apple Cards */}
      <div className="space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-3xl border border-slate-200/80 space-y-2.5 px-4">
            <AppleShippingBoxIcon size={44} className="mx-auto opacity-30" alt="Sin pedidos" />
            <p className="text-slate-800 font-black text-sm">No se encontraron pedidos</p>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              No hay pedidos que coincidan con la fecha o búsqueda seleccionada.
            </p>
            <button
              type="button"
              onClick={() => handleSelectPreset('today')}
              className="mt-2 inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Ver pedidos de hoy
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isDelivered = order.status === 'delivered';
            const isPending = order.status === 'pending';
            const isCancelled = order.status === 'cancelled';
            const hasGps = Boolean(order.latitude && order.longitude);

            return (
              <div
                key={order.id}
                onClick={() => router.push(`/pedido/${order.id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer select-none space-y-2.5"
              >
                {/* Header Fila 1: Número de orden y Estado */}
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

                {/* Centro Fila 2: Nombre de Comercio y Dirección/Referencia */}
                <div className="flex items-start justify-between gap-3 pt-0.5">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight truncate leading-snug">
                      {order.businessName || order.clientName}
                    </h3>
                    {cleanAddress(order.addressReference) && (
                      <p className="text-xs text-slate-500 truncate flex items-center tracking-normal">
                        <AppleMapPinIcon size={13} className="shrink-0 mr-1 opacity-50" alt="Dirección" />
                        <span className="truncate">{cleanAddress(order.addressReference)}</span>
                      </p>
                    )}
                  </div>

                  {/* Total y paquetes */}
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold font-mono text-slate-900 leading-tight tracking-tight">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <div className="text-xs font-medium text-slate-400">
                      {order.totalJavas > 0 && `${order.totalJavas} ${order.totalJavas === 1 ? 'paq' : 'paqs'}`}
                      {order.totalJavas > 0 && (order.totalUnits || 0) > 0 && ' + '}
                      {(order.totalUnits || 0) > 0 && `${order.totalUnits} ${(order.totalUnits || 0) === 1 ? 'und' : 'unds'}`}
                      {order.totalJavas === 0 && (order.totalUnits || 0) === 0 && `${order.totalBottles || order.items.length} bots`}
                    </div>
                  </div>
                </div>

                {/* Footer Fila 3: Saldo / Hora y Acciones Rápidas */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 gap-2">
                  {/* Saldo deudor y/o Hora de creación contextual */}
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

                  {/* Micro-acciones rápidas (stopPropagation para no abrir la página al dar clic) */}
                  <div
                    className="flex items-center space-x-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Botón GPS */}
                    {hasGps && (
                      <button
                        type="button"
                        onClick={() => handleOpenNavigation(order.latitude, order.longitude)}
                        className="w-8 h-8 rounded-xl bg-slate-100/80 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/70 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
                        title="Navegar con GPS"
                      >
                        <AppleMapPinIcon size={16} alt="Navegar con GPS" />
                      </button>
                    )}

                    {/* Botón WhatsApp */}
                    {order.whatsappNumber && (
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(order)}
                        className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
                        title="Enviar mensaje por WhatsApp"
                      >
                        <AppleWhatsAppIcon size={16} alt="Enviar mensaje por WhatsApp" />
                      </button>
                    )}

                    {/* Botón Recibo Térmico */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForThermal(order)}
                      className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
                      title="Ver / Imprimir Recibo"
                    >
                      <ApplePrinterIcon size={16} className="text-blue-700" />
                    </button>

                    {/* Botón Rápido de Entrega (solo si pendiente) */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="h-8 px-2.5 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
                        title="Marcar como entregado"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Entregar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* Thermal Receipt Modal (Munbyn 58mm) */}
      <ThermalReceiptModal
        isOpen={Boolean(selectedOrderForThermal)}
        onClose={() => setSelectedOrderForThermal(null)}
        order={selectedOrderForThermal}
        client={clients.find((c) => c.id === selectedOrderForThermal?.clientId)}
        invoice={invoices.find(
          (i) => i.orderId === selectedOrderForThermal?.id || i.id === selectedOrderForThermal?.invoiceId
        )}
      />
    </div>
  );
}
