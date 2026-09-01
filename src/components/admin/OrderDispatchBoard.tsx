'use client';

import React, { useState } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { formatCurrency, formatDate, generateWhatsAppOrderLink } from '@/lib/utils/formatters';
import { Order, Invoice } from '@/types';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Share2,
  Package,
  Phone,
  MapPin,
  Check,
  Navigation,
} from 'lucide-react';

export function OrderDispatchBoard() {
  const {
    orders,
    invoices,
    generateInvoice,
    updateOrderStatus,
  } = useDistribution();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos • {orders.length}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all relative ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Por Despachar • {orders.filter((o) => o.status === 'pending').length}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('delivered')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
              statusFilter === 'delivered'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Entregados • {orders.filter((o) => o.status === 'delivered').length}
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-700 font-extrabold text-sm">No hay pedidos en esta categoría</p>
            <p className="text-slate-500 text-xs">Selecciona otra pestaña para ver los registros.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const invoice = invoices.find((i) => i.orderId === order.id);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Top info */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      #{order.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">{formatDate(order.createdAt)}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {order.totalJavas} Javas
                    </span>
                    {order.saleType === 'autoventa' ? (
                      <span className="text-[11px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Autoventa
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Preventa
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {order.status === 'pending' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Por Despachar
                      </span>
                    )}
                    {order.status === 'delivered' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Entregado
                      </span>
                    )}
                    {order.status === 'cancelled' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-900">
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancelado
                      </span>
                    )}
                  </div>
                </div>

                {/* Client & Items details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Client Column */}
                  <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-extrabold text-[11px] uppercase tracking-wider block">
                        Destino y Contacto
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenNavigation(order.latitude, order.longitude)}
                        className="text-blue-700 hover:text-blue-900 font-extrabold text-xs flex items-center space-x-1"
                        title="Abrir ubicación en mapa"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Abrir GPS</span>
                      </button>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900">
                      {order.businessName || order.clientName}
                    </h4>
                    <p className="text-slate-600 font-medium">{order.clientName}</p>
                    <p className="font-mono text-slate-700 flex items-center">
                      <Phone className="w-3 h-3 mr-1 text-slate-400" />
                      {order.whatsappNumber}
                    </p>
                    <p className="text-slate-500 flex items-start">
                      <MapPin className="w-3 h-3 mr-1 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>{order.addressReference}</span>
                    </p>
                    {order.notes && (
                      <p className="text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 text-xs mt-1">
                        Nota: {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Items Column */}
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <span className="text-slate-500 font-extrabold text-[11px] uppercase tracking-wider block">
                      Detalle de Javas • {order.totalJavas} unidades
                    </span>
                    <div className="space-y-1.5">
                      {order.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs"
                        >
                          <div>
                            <span className="font-extrabold text-slate-900">
                              {it.quantityJavas}x Java
                            </span>{' '}
                            <span className="font-semibold text-slate-800">
                              {it.beverageType} • {it.size} {it.container}
                            </span>
                            <div className="text-[11px] text-slate-500">
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
                          <span className="font-mono font-extrabold text-slate-900">
                            {formatCurrency(it.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-black">
                      <span className="text-slate-700">Total:</span>
                      <span className="font-mono text-blue-700 text-base">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions bottom bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  {/* Left: Dispatch Actions */}
                  <div className="flex items-center space-x-2">
                    {order.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-xs"
                      >
                        <Check className="w-4 h-4" />
                        <span>Marcar como Despachado / Entregado</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Invoicing & WhatsApp actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(order)}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>

                    {invoice ? (
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(invoice)}
                        className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ver Factura #{invoice.invoiceNumber}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGenerateInvoice(order)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-xs transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Emitir Factura</span>
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
    </div>
  );
}
