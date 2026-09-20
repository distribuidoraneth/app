'use client';

import React, { use, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDistribution, STORAGE_KEY } from '@/context/DistributionContext';
import {
  formatCurrency,
  formatUnitPrice,
  formatOrderNumber,
  formatShortDateTime,
  generateWhatsAppOrderLink,
  formatItemTitle,
  getGoogleMapsNavigationUrl,
  cleanAddress,
} from '@/lib/utils/formatters';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { ThermalReceiptModal } from '@/components/receipt/ThermalReceiptModal';
import { Order } from '@/types';
import {
  AppleMapPinIcon,
  AppleWhatsAppIcon,
  AppleCheckmarkSealIcon,
  AppleReceiptIcon,
  ApplePrinterIcon,
  ApplePhoneIcon,
  AppleShippingBoxIcon,
  renderFlavorThumbnail,
} from '@/components/ui/AppleIcons';
import {
  ArrowLeft,
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
    cancelOrder,
    ensureOrderLoaded,
  } = useDistribution();

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isThermalModalOpen, setIsThermalModalOpen] = useState(false);

  const rawId = useMemo(() => decodeURIComponent(resolvedParams.id), [resolvedParams.id]);

  // 1. Buscar en contexto
  const orderFromContext = useMemo(() => {
    return orders.find(
      (o) =>
        o.id === rawId ||
        o.orderNumber === rawId ||
        formatOrderNumber(o.orderNumber) === formatOrderNumber(rawId)
    );
  }, [orders, rawId]);

  // 2. Caché local inmediata (evita cualquier pantalla de carga o error al recargar)
  const [localOrder] = useState<Order | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.orders)) {
          return (
            parsed.orders.find(
              (o: Order) =>
                o.id === rawId ||
                o.orderNumber === rawId ||
                formatOrderNumber(o.orderNumber) === formatOrderNumber(rawId)
            ) || null
          );
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [dbOrder, setDbOrder] = useState<Order | null>(null);

  const order = orderFromContext || localOrder || dbOrder;
  const [isCheckingOrder, setIsCheckingOrder] = useState(!order);

  useEffect(() => {
    let isMounted = true;
    if (order) {
      setIsCheckingOrder(false);
    }

    ensureOrderLoaded(rawId)
      .then((res) => {
        if (isMounted && res) {
          setDbOrder(res);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingOrder(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [rawId, ensureOrderLoaded]);

  const client = useMemo(() => {
    if (!order) return null;
    return clients.find((c) => c.id === order.clientId) || null;
  }, [clients, order]);

  const invoice = useMemo(() => {
    if (!order) return null;
    return invoices.find((inv) => inv.orderId === order.id) || null;
  }, [invoices, order]);

  if (isCheckingOrder && !order) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">Cargando datos del pedido...</p>
      </div>
    );
  }

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

  const mapsUrl = useMemo(() => {
    const lat = order.latitude || client?.latitude;
    const lng = order.longitude || client?.longitude;
    if (lat && lng) {
      return getGoogleMapsNavigationUrl(lat, lng);
    }
    const address = cleanAddress(order.addressReference || client?.addressReference);
    if (address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    return null;
  }, [order, client]);

  const handleOpenGps = () => {
    if (mapsUrl) {
      window.open(mapsUrl, '_blank');
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
  const isCancelled = order.status === 'cancelled';
  const subtotal15 = Number((order.totalAmount / 1.15).toFixed(2));
  const totalIva15 = Number((order.totalAmount - subtotal15).toFixed(2));

  const handleCancelOrder = () => {
    if (window.confirm('¿Deseas cancelar este pedido?')) {
      cancelOrder(order.id);
    }
  };

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
            {isCancelled ? (
              <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/70">
                Cancelado
              </span>
            ) : isDelivered ? (
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70">
                <AppleCheckmarkSealIcon size={14} className="mr-1 text-emerald-700" />
                Entregado
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/70">
                <AppleShippingBoxIcon size={14} className="mr-1 text-amber-700" />
                Por Despachar
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Card 1: Cliente y Ubicación */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cliente
            </span>
            {client?.taxId && (
              <span className="font-mono text-xs text-slate-400">
                {client.taxId}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {order.businessName || order.clientName}
            </h2>
            {order.businessName && order.clientName && order.businessName !== order.clientName && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">{order.clientName}</p>
            )}
          </div>

          <div className="space-y-2.5 pt-1 text-sm text-slate-600">
            {order.whatsappNumber && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <ApplePhoneIcon size={16} className="text-slate-400 shrink-0" alt="Teléfono" />
                  <span className="font-mono text-slate-800 font-medium">{order.whatsappNumber}</span>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <a
                    href={`https://wa.me/${order.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 flex items-center justify-center border border-emerald-200/60 transition-all cursor-pointer shadow-2xs"
                    title="WhatsApp"
                    aria-label="WhatsApp"
                  >
                    <AppleWhatsAppIcon size={16} alt="WhatsApp" />
                  </a>
                  <a
                    href={`tel:${order.whatsappNumber.replace(/[^0-9+]/g, '')}`}
                    className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 flex items-center justify-center border border-blue-200/60 transition-all cursor-pointer shadow-2xs"
                    title="Llamar"
                    aria-label="Llamar"
                  >
                    <ApplePhoneIcon size={16} className="text-blue-700" />
                  </a>
                </div>
              </div>
            )}
            {cleanAddress(order.addressReference || client?.addressReference) && (
              mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start space-x-2 text-slate-600 hover:text-blue-600 group transition-colors cursor-pointer"
                  title="Abrir ubicación en Google Maps"
                >
                  <AppleMapPinIcon
                    size={16}
                    className="opacity-60 group-hover:opacity-100 group-hover:text-blue-600 shrink-0 mt-0.5 transition-all"
                    alt="Ubicación"
                  />
                  <span className="leading-relaxed group-hover:underline">
                    {cleanAddress(order.addressReference || client?.addressReference)}
                  </span>
                </a>
              ) : (
                <div className="flex items-start space-x-2">
                  <AppleMapPinIcon size={16} className="opacity-60 shrink-0 mt-0.5" alt="Ubicación" />
                  <span className="text-slate-600 leading-relaxed">
                    {cleanAddress(order.addressReference || client?.addressReference)}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Card 2: Detalle */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Detalle
            </span>
            <span className="text-xs font-mono font-medium text-slate-400">
              {order.totalJavas > 0 && `${order.totalJavas} ${order.totalJavas === 1 ? 'pack' : 'packs'}`}
              {order.totalJavas > 0 && (order.totalUnits || 0) > 0 && ' + '}
              {(order.totalUnits || 0) > 0 && `${order.totalUnits} ${(order.totalUnits || 0) === 1 ? 'und' : 'unds'}`}
              {order.totalJavas === 0 && (order.totalUnits || 0) === 0 && `${order.items.length} ítems`}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => {
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
                  {/* Fila del Paquete / Java */}
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

                  {/* Fila de la Unidad Suelta */}
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

                  {/* Fallback para órdenes históricas */}
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
            {isCancelled ? (
              <div className="col-span-2 py-3.5 bg-rose-50 text-rose-700 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 border border-rose-200/70">
                <span>Este pedido fue cancelado</span>
              </div>
            ) : (
              <>
                {/* Toggle de Entrega */}
                {isPending ? (
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="col-span-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer"
                  >
                    <AppleCheckmarkSealIcon size={16} className="text-white" />
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
                  <AppleWhatsAppIcon size={18} alt="WhatsApp" />
                  <span>WhatsApp</span>
                </button>

                {/* Imprimir */}
                <button
                  type="button"
                  onClick={() => setIsThermalModalOpen(true)}
                  className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 border border-slate-200 transition-colors cursor-pointer"
                >
                  <ApplePrinterIcon size={18} className="text-slate-700" />
                  <span>Imprimir</span>
                </button>

                {/* Factura */}
                {invoice ? (
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(invoice)}
                    className="col-span-2 py-3 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 border border-blue-200/60 transition-colors cursor-pointer"
                  >
                    <AppleReceiptIcon size={18} className="text-blue-700" />
                    <span>Factura #{invoice.invoiceNumber}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateInvoice}
                    className="col-span-2 py-3 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer"
                  >
                    <AppleReceiptIcon size={18} className="text-white" />
                    <span>Factura</span>
                  </button>
                )}

                {/* Botón Cancelar Pedido */}
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  className="col-span-2 py-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50/70 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer border border-transparent hover:border-rose-200/60 mt-1"
                >
                  <span>Cancelar Pedido</span>
                </button>
              </>
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
