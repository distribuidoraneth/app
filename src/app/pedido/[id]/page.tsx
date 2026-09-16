'use client';

import React, { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDistribution } from '@/context/DistributionContext';
import {
  formatCurrency,
  formatOrderNumber,
  formatShortDateTime,
  generateWhatsAppOrderLink,
  formatItemTitle,
  getGoogleMapsNavigationUrl,
  cleanAddress,
} from '@/lib/utils/formatters';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { ThermalReceiptModal } from '@/components/receipt/ThermalReceiptModal';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Navigation,
  Share2,
  Printer,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const {
    orders,
    clients,
    invoices,
    generateInvoice,
    updateOrderStatus,
  } = useDistribution();

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isThermalModalOpen, setIsThermalModalOpen] = useState(false);

  // Find order by ID or orderNumber
  const order = useMemo(() => {
    const rawId = decodeURIComponent(resolvedParams.id);
    return orders.find(
      (o) =>
        o.id === rawId ||
        o.orderNumber === rawId ||
        formatOrderNumber(o.orderNumber) === formatOrderNumber(rawId)
    );
  }, [orders, resolvedParams.id]);

  const client = useMemo(() => {
    if (!order) return null;
    return clients.find((c) => c.id === order.clientId) || null;
  }, [clients, order]);

  const invoice = useMemo(() => {
    if (!order) return null;
    return invoices.find((inv) => inv.orderId === order.id) || null;
  }, [invoices, order]);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Pedido no encontrado</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          El identificador solicitado no coincide con ningún pedido registrado.
        </p>
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
        >
          Volver al panel
        </button>
      </div>
    );
  }

  const handleOpenGps = () => {
    const lat = order.latitude || client?.latitude;
    const lng = order.longitude || client?.longitude;
    if (lat && lng) {
      window.open(getGoogleMapsNavigationUrl(lat, lng), '_blank');
    }
  };

  const handleShareWhatsApp = () => {
    let inv = invoice;
    if (!inv) {
      inv = generateInvoice(order.id) || null;
    }
    const url = generateWhatsAppOrderLink({
      phone: order.whatsappNumber || client?.whatsappNumber || '',
      clientName: order.businessName || order.clientName,
      orderNumber: formatOrderNumber(order.orderNumber),
      total: order.totalAmount,
      invoiceNumber: inv?.invoiceNumber,
    });
    window.open(url, '_blank');
  };

  const handleGenerateInvoice = () => {
    const inv = generateInvoice(order.id);
    if (inv) {
      setSelectedInvoice(inv);
    }
  };

  const isDelivered = order.status === 'delivered';
  const isPending = order.status === 'pending';

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-slate-900">
      {/* Top Header estilo Apple */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="flex items-center space-x-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 active:scale-95 transition-all cursor-pointer py-1 pr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Pedidos</span>
          </button>

          <div className="text-center">
            <span className="text-sm font-black font-mono tracking-tight text-slate-900 block">
              {formatOrderNumber(order.orderNumber)}
            </span>
            <span className="text-xs text-slate-400 font-medium block">
              {formatShortDateTime(order.createdAt)}
            </span>
          </div>

          <div className="flex items-center">
            {isDelivered ? (
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Entregado
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/70">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Por Despachar
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Card 1: Destino y Cliente */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cliente y Ubicación
            </span>
            {(order.latitude || client?.latitude) && (
              <button
                type="button"
                onClick={handleOpenGps}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navegar GPS</span>
              </button>
            )}
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900">
              {order.businessName || order.clientName}
            </h2>
            {order.businessName && order.clientName && order.businessName !== order.clientName && (
              <p className="text-sm text-slate-500 font-medium mt-0.5">{order.clientName}</p>
            )}
          </div>

          <div className="space-y-2 pt-1 text-sm text-slate-600">
            {order.whatsappNumber && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono text-slate-800 font-medium">{order.whatsappNumber}</span>
              </div>
            )}
            {cleanAddress(order.addressReference || client?.addressReference) && (
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-slate-600 leading-relaxed">
                  {cleanAddress(order.addressReference || client?.addressReference)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Detalle de Productos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Productos ({order.totalJavas} paquetes)
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-500">
              {order.items.length} ítems
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-slate-900">
                    <span className="font-mono text-slate-500 mr-2">{item.quantityJavas}x</span>
                    {formatItemTitle(item)}
                  </div>
                  {item.flavorType === 'surtido' && item.surtidoDetails && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Surtido:{' '}
                      {Object.entries(item.surtidoDetails)
                        .filter(([_, q]) => q > 0)
                        .map(([f, q]) => `${q} ${f}`)
                        .join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    {formatCurrency(item.pricePerJava)} c/paquete
                  </p>
                </div>
                <span className="font-mono font-bold text-sm text-slate-900 shrink-0">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Subtotal & Total */}
          <div className="border-t border-slate-200/80 pt-3 space-y-2">
            <div className="flex justify-between items-center text-base font-black">
              <span className="text-slate-800">Total a pagar:</span>
              <span className="font-mono text-slate-900 text-lg">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>

            {order.debtBalance > 0 && (
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-amber-800 bg-amber-50/80 px-3.5 py-2.5 rounded-xl border border-amber-200/60 mt-2">
                <span>Saldo pendiente:</span>
                <span className="font-mono font-black">{formatCurrency(order.debtBalance)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Acciones Operativas y Entrega */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2.5">
            Acciones Rápidas
          </span>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Toggle de Entrega */}
            {isPending ? (
              <button
                type="button"
                onClick={() => updateOrderStatus(order.id, 'delivered')}
                className="col-span-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Marcar como Entregado</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => updateOrderStatus(order.id, 'pending')}
                className="col-span-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>Cambiar a Por Despachar</span>
              </button>
            )}

            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-3 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 border border-emerald-200/60 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            {/* Ticket Térmico */}
            <button
              type="button"
              onClick={() => setIsThermalModalOpen(true)}
              className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 border border-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Ticket 58mm</span>
            </button>

            {/* Factura */}
            {invoice ? (
              <button
                type="button"
                onClick={() => setSelectedInvoice(invoice)}
                className="col-span-2 py-3 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 border border-blue-200/60 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Ver Factura #{invoice.invoiceNumber}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateInvoice}
                className="col-span-2 py-3 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Emitir Factura Electrónica</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Modales necesarios para Factura y Recibo Térmico */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      <ThermalReceiptModal
        isOpen={isThermalModalOpen}
        onClose={() => setIsThermalModalOpen(false)}
        order={order}
        client={client}
        invoice={invoice}
      />
    </div>
  );
}
