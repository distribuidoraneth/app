'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDistribution } from '@/context/DistributionContext';
import {
  formatCurrency,
  formatDate,
  formatOrderNumber,
  formatShortDateTime,
  generateWhatsAppOrderLink,
  formatItemTitle,
  getGoogleMapsNavigationUrl,
  cleanAddress,
} from '@/lib/utils/formatters';
import { Order, Invoice } from '@/types';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { ThermalReceiptModal } from '@/components/receipt/ThermalReceiptModal';
import { AppleMapPinIcon, AppleWhatsAppIcon } from '@/components/ui/AppleIcons';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Package,
  Phone,
  Check,
  Printer,
} from 'lucide-react';

export function OrderDispatchBoard() {
  const router = useRouter();
  const {
    orders,
    invoices,
    clients,
    generateInvoice,
    updateOrderStatus,
  } = useDistribution();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedOrderForThermal, setSelectedOrderForThermal] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'pending') return o.status === 'pending';
    if (statusFilter === 'delivered') return o.status === 'delivered';
    return true;
  });

  const handleGenerateInvoice = (order: Order) => {
    const inv = generateInvoice(order.id);
    if (inv) {
      setSelectedInvoice(inv);
    }
  };

  const handleShareWhatsApp = (order: Order) => {
    let inv = invoices.find((i) => i.orderId === order.id);
    if (!inv) {
      inv = generateInvoice(order.id) || undefined;
    }

    const link = generateWhatsAppOrderLink({
      phone: order.whatsappNumber,
      clientName: order.clientName,
      orderNumber: order.orderNumber,
      total: order.totalAmount,
      invoiceNumber: inv?.invoiceNumber,
    });
    window.open(link, '_blank');
  };

  const handleOpenNavigation = (lat: number, lng: number) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Liquid Material Filter Pill (Full Width, Balanced & Neutral) */}
      <div className="w-full">
        <div
          role="tablist"
          className="w-full grid grid-cols-3 p-1.5 bg-slate-200/80 border border-white/90 backdrop-blur-2xl rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
        >
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: 'Por Despachar' },
              { id: 'delivered', label: 'Entregados' },
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
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-700 font-extrabold text-sm">No hay pedidos en esta categoría</p>
            <p className="text-slate-400 text-xs">Selecciona otra opción de la píldora para ver los registros.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isDelivered = order.status === 'delivered';
            const isPending = order.status === 'pending';
            const hasGps = Boolean(order.latitude && order.longitude);

            return (
              <div
                key={order.id}
                onClick={() => router.push(`/pedido/${order.id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer select-none space-y-2.5"
              >
                {/* Header Fila 1: Número, Fecha, Estado */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-xs sm:text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/70">
                      {formatOrderNumber(order.orderNumber)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {formatShortDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div>
                    {isDelivered ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Entregado
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Por Despachar
                      </span>
                    )}
                  </div>
                </div>

                {/* Centro Fila 2: Nombre de Comercio y Dirección/Referencia */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-base font-black text-slate-900 truncate">
                      {order.businessName || order.clientName}
                    </h3>
                    {cleanAddress(order.addressReference) && (
                      <p className="text-xs sm:text-[13px] text-slate-500 truncate flex items-center">
                        <AppleMapPinIcon size={14} className="shrink-0 mr-1 opacity-60" alt="Dirección" />
                        <span className="truncate">{cleanAddress(order.addressReference)}</span>
                      </p>
                    )}
                  </div>

                  {/* Total y paquetes */}
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black font-mono text-slate-900 leading-tight">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <div className="text-xs font-bold text-slate-400">
                      {order.totalJavas} paquetes
                    </div>
                  </div>
                </div>

                {/* Footer Fila 3: Saldo pendiente (solo si > 0) y Acciones Rápidas */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                  {/* Saldo deudor (únicamente si existe) */}
                  <div className="min-w-0">
                    {order.debtBalance > 0 ? (
                      <span className="inline-flex items-center text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 truncate">
                        Saldo: {formatCurrency(order.debtBalance)}
                      </span>
                    ) : (
                      <span />
                    )}
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
                        className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/70 transition-colors cursor-pointer flex items-center justify-center"
                        title="Navegar con GPS"
                      >
                        <AppleMapPinIcon size={18} alt="Navegar con GPS" />
                      </button>
                    )}

                    {/* Botón WhatsApp */}
                    {order.whatsappNumber && (
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(order)}
                        className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors cursor-pointer flex items-center justify-center"
                        title="Enviar mensaje por WhatsApp"
                      >
                        <AppleWhatsAppIcon size={18} alt="Enviar mensaje por WhatsApp" />
                      </button>
                    )}

                    {/* Botón Rápido de Entrega (solo si pendiente) */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
                        title="Marcar como entregado"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Entregar</span>
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
