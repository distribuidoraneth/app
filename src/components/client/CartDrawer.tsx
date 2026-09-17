'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDistribution } from '@/context/DistributionContext';
import { formatCurrency, formatItemTitle } from '@/lib/utils/formatters';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Banknote,
  Building2,
  MapPin,
  ArrowRight,
  Package,
  ChevronLeft,
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
  Share2,
  FileText,
  ExternalLink,
  Store,
  Copy,
  Check,
  Printer,
} from 'lucide-react';
import { PaymentMethod, SaleType, Invoice, Order } from '@/types';
import { ThermalReceiptModal } from '@/components/receipt/ThermalReceiptModal';
import { AppleWhatsAppIcon } from '@/components/ui/AppleIcons';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  onOrderSuccess?: (orderId: string) => void;
  saleType?: SaleType;
}

export function CartDrawer({
  isOpen,
  onClose,
  clientId,
  onOrderSuccess,
  saleType: propSaleType = 'autoventa',
}: CartDrawerProps) {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    cartTotalAmount,
    cartTotalJavas,
    cartTotalUnits,
    cartTotalBottles,
    clearCart,
    createOrder,
    clients,
    selectedClientId,
    invoices,
    orders,
  } = useDistribution();

  const activeClient = clients.find((c) => c.id === (clientId || selectedClientId)) || clients[0];
  const nextOrderNumber = `ORD-${String(orders.length + 101).padStart(5, '0')}`;

  const [saleType, setSaleType] = useState<SaleType>(propSaleType);

  useEffect(() => {
    if (propSaleType) {
      setSaleType(propSaleType);
    }
  }, [propSaleType]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>('Mañana (8:00 - 12:00)');
  const [promisedDate, setPromisedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [promisedTime, setPromisedTime] = useState<string>('Mañana (8:00 - 11:00)');
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [customTimeInput, setCustomTimeInput] = useState<string>('');
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const todayIso = new Date().toISOString().split('T')[0];
  const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const in3DaysIso = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const in7DaysIso = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const getNextSaturdayIso = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    const sat = new Date(d.getTime() + diff * 86400000);
    return sat.toISOString().split('T')[0];
  };

  const getNextMondayIso = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (1 - day + 7) % 7 || 7;
    const mon = new Date(d.getTime() + diff * 86400000);
    return mon.toISOString().split('T')[0];
  };

  const getEndOfMonthIso = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  };

  const nextSatIso = getNextSaturdayIso();
  const nextMonIso = getNextMondayIso();
  const endMonthIso = getEndOfMonthIso();

  const formatHumanDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(y, m - 1, d);
      target.setHours(0, 0, 0, 0);
      const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

      let badge = '';
      if (diffDays === 0) badge = ' • Hoy';
      else if (diffDays === 1) badge = ' • Mañana';
      else if (diffDays === 2) badge = ' • Pasado mañana';
      else if (diffDays > 2) badge = ` • En ${diffDays} días`;
      else if (diffDays < 0) badge = ' • Fecha pasada';

      const formatted = date.toLocaleDateString('es-EC', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return `${formatted.charAt(0).toUpperCase() + formatted.slice(1)}${badge}`;
    } catch {
      return dateStr;
    }
  };

  const [notes, setNotes] = useState<string>('');
  const [addressRef, setAddressRef] = useState<string>(activeClient?.addressReference || '');

  useEffect(() => {
    if (activeClient?.addressReference) {
      setAddressRef(activeClient.addressReference);
    }
  }, [activeClient?.id, activeClient?.addressReference]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdOrderSummary, setCreatedOrderSummary] = useState<{
    orderId: string;
    orderNumber: string;
    saleType: SaleType;
    totalAmount: number;
    amountPaid: number;
    debtBalance: number;
    promisedCollectionDate?: string;
    promisedCollectionTime?: string;
    invoiceId?: string;
    invoiceNumber?: string;
  } | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showThermalModal, setShowThermalModal] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [copiedBank, setCopiedBank] = useState<boolean>(false);
  const [copiedDeuna, setCopiedDeuna] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen && cartTotalAmount > 0) {
      setAmountPaidInput(cartTotalAmount.toFixed(2));
    }
  }, [cartTotalAmount, isOpen]);

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const handleCopy = (text: string, type: 'bank' | 'deuna') => {
    navigator.clipboard.writeText(text);
    if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else {
      setCopiedDeuna(true);
      setTimeout(() => setCopiedDeuna(false), 2000);
    }
  };

  if (!isOpen || !mounted) return null;

  const numericPaid = parseFloat(amountPaidInput) || 0;
  const debtBalance = Math.max(0, Number((cartTotalAmount - numericPaid).toFixed(2)));

  const handleConfirmOrder = () => {
    if (cart.length === 0 || !activeClient) return;

    setIsSubmitting(true);

    const effectivePromisedTime = isCustomTime && customTimeInput.trim()
      ? customTimeInput.trim()
      : promisedTime;

    try {
      const order = createOrder({
        clientId: activeClient.id,
        items: cart,
        paymentMethod,
        saleType,
        scheduledDeliveryDate: saleType === 'preventa' ? scheduledDate : undefined,
        scheduledTimeSlot: saleType === 'preventa' ? scheduledTimeSlot : undefined,
        promisedCollectionDate: debtBalance > 0 ? promisedDate : undefined,
        promisedCollectionTime: debtBalance > 0 ? effectivePromisedTime : undefined,
        amountPaid: Math.min(cartTotalAmount, numericPaid),
        notes,
        customLocation: {
          latitude: activeClient.latitude,
          longitude: activeClient.longitude,
          addressReference: addressRef,
        },
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      const matchedInvoice = invoices.find((i) => i.orderId === order.id || i.id === order.invoiceId);

      setCreatedOrder(order);
      setCreatedOrderSummary({
        orderId: order.id,
        orderNumber: order.orderNumber,
        saleType: order.saleType,
        totalAmount: order.totalAmount,
        amountPaid: order.amountPaid,
        debtBalance: order.debtBalance,
        promisedCollectionDate: order.promisedCollectionDate,
        promisedCollectionTime: order.promisedCollectionTime,
        invoiceId: matchedInvoice?.id || order.invoiceId,
        invoiceNumber: matchedInvoice?.invoiceNumber,
      });

      setIsSubmitting(false);
      onOrderSuccess?.(order.id);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleCloseAll = () => {
    setCreatedOrder(null);
    setShowThermalModal(false);
    setCreatedOrderSummary(null);
    onClose();
  };

  const handleShareWhatsApp = () => {
    if (!createdOrderSummary) return;

    let phone = activeClient?.whatsappNumber?.replace(/\D/g, '') || '';
    if (phone.startsWith('0')) {
      phone = '593' + phone.slice(1);
    } else if (!phone.startsWith('593')) {
      phone = '593' + phone;
    }
    const invoiceLink = createdOrderSummary.invoiceId
      ? `${window.location.origin}/factura/${createdOrderSummary.invoiceId}`
      : '';

    const text = `*ANETH DISTRIBUCIONES* - Comprobante de Entrega\n\n` +
      `*Pedido:* ${createdOrderSummary.orderNumber}\n` +
      `*Cliente:* ${activeClient?.businessName || activeClient?.fullName}\n` +
      `*Tipo de Venta:* ${createdOrderSummary.saleType === 'autoventa' ? 'Autoventa (Entregado al instante)' : 'Preventa Programada'}\n` +
      `*Total:* $${createdOrderSummary.totalAmount.toFixed(2)}\n` +
      `*Valor Pagado:* $${createdOrderSummary.amountPaid.toFixed(2)}\n` +
      (createdOrderSummary.debtBalance > 0
        ? `*Saldo Pendiente:* $${createdOrderSummary.debtBalance.toFixed(2)}\n*Fecha pactada de cobro:* ${createdOrderSummary.promisedCollectionDate || 'Por coordinar'} (${createdOrderSummary.promisedCollectionTime || 'En ruta'})\n`
        : `*Estado:* Pagado Completo\n`) +
      (invoiceLink ? `\n*Factura Electrónica SRI:* ${invoiceLink}\n` : '') +
      `\n_Gracias por su preferencia - Aneth Distribuciones_`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center sm:p-4 overflow-y-auto">
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-xl bg-white sm:rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleCloseAll}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all active:scale-95 flex items-center space-x-1"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-black sm:hidden">Volver</span>
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                  {createdOrderSummary ? 'Comprobante' : 'Pedido'}
                </h2>
                {!createdOrderSummary && (
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      #{nextOrderNumber}
                    </span>
                    {saleType === 'preventa' ? (
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center">
                        <Calendar className="w-3 h-3 text-emerald-600 mr-1" />
                        Preventa
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-blue-800 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full flex items-center">
                        <Zap className="w-3 h-3 text-blue-600 fill-blue-600 mr-1" />
                        Autoventa
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="font-bold text-slate-800">
                  {activeClient?.businessName || activeClient?.fullName || 'Cliente'}
                </span>
                {activeClient?.whatsappNumber && (
                  <span className="font-mono text-slate-500">
                    • {activeClient.whatsappNumber}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!createdOrderSummary && cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg font-black transition-colors"
              >
                Vaciar
              </button>
            )}
            <button
              type="button"
              onClick={handleCloseAll}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#fafbfc]">
          {/* SUCCESS SCREEN */}
          {createdOrderSummary ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  {createdOrderSummary.saleType === 'autoventa'
                    ? 'Autoventa • Despachado al Instante'
                    : 'Preventa • Pedido Programado'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 pt-2 font-mono">
                  {createdOrderSummary.orderNumber}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {activeClient?.businessName || activeClient?.fullName}
                </p>
              </div>

              {/* Financial Box */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-left text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-500">Monto Total de Venta:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {formatCurrency(createdOrderSummary.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor Cobrado / Pagado:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatCurrency(createdOrderSummary.amountPaid)}
                  </span>
                </div>
                {createdOrderSummary.debtBalance > 0 ? (
                  <>
                    <div className="flex justify-between pt-2 border-t border-slate-100 text-amber-900 font-bold">
                      <span>Saldo Pendiente (Cartera):</span>
                      <span className="font-mono font-black text-amber-700">{formatCurrency(createdOrderSummary.debtBalance)}</span>
                    </div>
                    {createdOrderSummary.promisedCollectionDate && (
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Cobro Programado:</span>
                        <span className="font-bold text-slate-800">
                          {createdOrderSummary.promisedCollectionDate} • {createdOrderSummary.promisedCollectionTime}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between pt-2 border-t border-slate-100 text-emerald-700 font-bold">
                    <span>Estado de Pago:</span>
                    <span>Totalmente Cancelado</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full py-3.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 active:scale-98 text-emerald-900 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer"
                >
                  <AppleWhatsAppIcon size={18} alt="WhatsApp" />
                  <span>Enviar Comprobante por WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowThermalModal(true)}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Recibo Térmico (Munbyn 58mm)</span>
                </button>

                {createdOrderSummary.invoiceId && (
                  <Link
                    href={`/factura/${createdOrderSummary.invoiceId}`}
                    target="_blank"
                    className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-xs transition-all"
                  >
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Ver / Descargar Factura Electrónica SRI (RIDE)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-colors"
                >
                  Cerrar y Continuar Venta
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Package className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-600">El carrito de pedidos está vacío</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black"
              >
                Volver al Catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preventa Schedule Picker */}
              {saleType === 'preventa' && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                    Programación de Entrega
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-emerald-800 block mb-1">Fecha de Entrega:</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full text-xs sm:text-sm font-bold px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-emerald-800 block mb-1">Franja Horaria:</label>
                      <select
                        value={scheduledTimeSlot}
                        onChange={(e) => setScheduledTimeSlot(e.target.value)}
                        className="w-full text-xs sm:text-sm font-bold px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      >
                        <option value="Mañana (8:00 - 12:00)">Mañana (8:00 - 12:00)</option>
                        <option value="Tarde (13:00 - 17:00)">Tarde (13:00 - 17:00)</option>
                        <option value="Noche (17:00 - 20:00)">Noche (17:00 - 20:00)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-3">
                <span className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider block">
                  Productos en el Pedido • {cartTotalBottles} {cartTotalBottles === 1 ? 'botella' : 'botellas'}
                </span>

                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-black text-sm sm:text-base text-slate-900">
                            {formatItemTitle(item)}
                          </span>
                          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-2 py-0.5 rounded-md">
                            {item.unitsPerJava} un/paca
                          </span>
                        </div>

                        {item.flavorType === 'surtido' && item.surtidoDetails && (
                          <div className="pt-0.5">
                            <span className="text-xs font-bold text-slate-500 block mb-0.5">
                              {item.container === 'Vidrio' ? 'Java Surtida:' : 'Pack Surtido:'}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(item.surtidoDetails).map(([fl, qty]) => (
                                <span
                                  key={fl}
                                  className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-xs text-slate-800 font-bold"
                                >
                                  {qty}x {fl}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-base sm:text-lg font-mono font-black text-blue-700 block">
                          {formatCurrency(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Steppers */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <span className="text-xs font-black text-slate-700 px-1">
                          {item.container === 'Vidrio' ? 'Javas:' : 'Packs:'}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantityJavas - 1, item.quantityUnits)}
                          className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-800 font-black shadow-2xs active:scale-95 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-black font-mono text-slate-900">
                          {item.quantityJavas}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantityJavas + 1, item.quantityUnits)}
                          className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-800 font-black shadow-2xs active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <span className="text-xs font-black text-slate-700 px-1">Sueltas:</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantityJavas, item.quantityUnits - 1)}
                          className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-800 font-black shadow-2xs active:scale-95 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-black font-mono text-slate-900">
                          {item.quantityUnits}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantityJavas, item.quantityUnits + 1)}
                          className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-800 font-black shadow-2xs active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAYMENT & DEBT CONTROLS */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Forma de Pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('cash')}
                    className={`py-3 px-2 rounded-2xl border flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs">Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('deuna')}
                    className={`py-3 px-2 rounded-2xl border flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer ${
                      paymentMethod === 'deuna'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-xs">DeUna</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('transfer')}
                    className={`py-3 px-2 rounded-2xl border flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer ${
                      paymentMethod === 'transfer'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs">Transferencia</span>
                  </button>
                </div>

                {/* TRANSFERENCIA BANCARIA: DATOS A LA MANO CON BOTÓN COPIAR */}
                {paymentMethod === 'transfer' && (
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center">
                        <Building2 className="w-3.5 h-3.5 mr-1.5 text-blue-700 shrink-0" />
                        Datos Bancarios para Transferencia
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `Banco Pichincha - Cuenta de Ahorros\nCta: 2204567890\nTitular: ANDRADE CONSTANTE ANA ELIZABETH\nCI: 1803013810`,
                            'bank'
                          )
                        }
                        className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-black flex items-center space-x-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        {copiedBank ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-blue-600" />
                            <span>Copiar Datos</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm bg-white p-3 rounded-xl border border-blue-100 font-medium">
                      <div>
                        <span className="text-slate-400 block text-xs font-bold">Banco:</span>
                        <span className="font-black text-slate-800">Banco Pichincha</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-xs font-bold">Tipo:</span>
                        <span className="font-bold text-slate-800">Ahorros</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-xs font-bold">N° Cuenta:</span>
                        <span className="font-mono font-black text-blue-700 select-all">2204567890</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-xs font-bold">Cédula / RUC:</span>
                        <span className="font-mono font-bold text-slate-800 select-all">1803013810</span>
                      </div>
                      <div className="col-span-2 pt-1.5 border-t border-slate-100">
                        <span className="text-slate-400 block text-xs font-bold">Titular:</span>
                        <span className="font-black text-slate-900">ANDRADE CONSTANTE ANA ELIZABETH</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* DEUNA: DATOS A LA MANO CON BOTÓN COPIAR */}
                {paymentMethod === 'deuna' && (
                  <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center">
                        <Zap className="w-3.5 h-3.5 mr-1.5 text-purple-700 shrink-0" />
                        Cobro Inmediato por DeUna
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('0963906286', 'deuna')}
                        className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-black flex items-center space-x-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        {copiedDeuna ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-purple-600" />
                            <span>Copiar Celular</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-xs font-bold">Número Celular DeUna:</span>
                        <span className="font-mono text-base font-black text-purple-950 select-all">096 390 6286</span>
                        <span className="text-xs text-slate-500 font-bold block mt-0.5">
                          Titular: Ana Andrade
                        </span>
                      </div>
                      <div className="px-2.5 py-1 bg-purple-100 text-purple-800 font-black text-xs rounded-lg">
                        Sin comisión
                      </div>
                    </div>
                  </div>
                )}

                {/* Monto Recibido / Pagado ($) Input */}
                <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <label className="text-xs font-black text-slate-800">
                      Monto Recibido / Pagado ($):
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setAmountPaidInput(cartTotalAmount.toFixed(2))}
                        className={`text-xs font-black px-3 py-1 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                          numericPaid === cartTotalAmount
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white hover:bg-blue-50 text-blue-700 border-slate-200'
                        }`}
                      >
                        Total
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmountPaidInput('0.00')}
                        className={`text-xs font-black px-3 py-1 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                          numericPaid === 0 && amountPaidInput !== ''
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white hover:bg-amber-50 text-amber-800 border-slate-200'
                        }`}
                      >
                        Crédito
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-lg sm:text-xl font-bold text-slate-400 font-mono">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      placeholder={cartTotalAmount.toFixed(2)}
                      className="w-full text-lg sm:text-xl font-black font-mono pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-xs"
                    />
                  </div>

                  {debtBalance === 0 ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center justify-between">
                      <span className="flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                        {numericPaid > cartTotalAmount
                          ? 'Vuelto / Cambio a entregar:'
                          : 'Pago Completo • Cancelado en su totalidad'}
                      </span>
                      <span className="font-mono text-xs font-black text-emerald-700">
                        {numericPaid > cartTotalAmount
                          ? formatCurrency(Number((numericPaid - cartTotalAmount).toFixed(2)))
                          : '$0.00 pendiente'}
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/70 border-2 border-amber-300/80 rounded-2xl space-y-3.5 shadow-xs animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center">
                          <Clock className="w-4 h-4 mr-1.5 text-amber-700 shrink-0" />
                          Programar Cobro del Saldo
                        </span>
                        <span className="font-mono text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl shadow-2xs">
                          {formatCurrency(debtBalance)} a cobrar
                        </span>
                      </div>

                      <p className="text-xs text-amber-900 font-medium leading-relaxed">
                        ¿Cuándo y a qué hora ofreció pagar el saldo restante <strong className="text-slate-950 underline decoration-amber-400">{activeClient?.businessName || activeClient?.fullName}</strong>?
                      </p>

                      {/* Callout mostrando la fecha elegida en español claro */}
                      <div className="bg-white border border-amber-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-xs font-black text-amber-950 truncate">
                            {formatHumanDate(promisedDate)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              dateInputRef.current?.showPicker();
                            } catch {
                              dateInputRef.current?.focus();
                            }
                          }}
                          className="text-xs font-black text-amber-800 hover:text-amber-950 bg-amber-100/90 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                        >
                          Abrir Calendario 📅
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                        {/* Selector de Fecha */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-amber-950 flex items-center justify-between">
                            <span>Fecha de Cobro Pactada:</span>
                            <span className="text-xs text-amber-700 font-semibold">Toca para cambiar</span>
                          </label>

                          <div
                            onClick={() => {
                              try {
                                dateInputRef.current?.showPicker();
                              } catch {
                                dateInputRef.current?.focus();
                              }
                            }}
                            className="relative flex items-center bg-white border-2 border-amber-300 rounded-xl px-3 py-2 cursor-pointer hover:border-amber-500 transition-colors shadow-2xs"
                          >
                            <Calendar className="w-4 h-4 text-amber-600 mr-2 shrink-0" />
                            <input
                              ref={dateInputRef}
                              type="date"
                              min={todayIso}
                              value={promisedDate}
                              onChange={(e) => setPromisedDate(e.target.value)}
                              onClick={(e) => {
                                try {
                                  e.currentTarget.showPicker();
                                } catch {}
                              }}
                              className="w-full text-xs sm:text-sm font-black text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
                            />
                          </div>

                          {/* Botones de fechas rápidas y comunes */}
                          <div className="flex gap-1.5 pt-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setPromisedDate(todayIso)}
                              className={`text-xs font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                                promisedDate === todayIso
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                              }`}
                            >
                              Hoy
                            </button>
                            <button
                              type="button"
                              onClick={() => setPromisedDate(tomorrowIso)}
                              className={`text-xs font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                                promisedDate === tomorrowIso
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                              }`}
                            >
                              Mañana
                            </button>
                            <button
                              type="button"
                              onClick={() => setPromisedDate(in3DaysIso)}
                              className={`text-xs font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                                promisedDate === in3DaysIso
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                              }`}
                            >
                              En 3 días
                            </button>
                            <button
                              type="button"
                              onClick={() => setPromisedDate(nextSatIso)}
                              className={`text-xs font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                                promisedDate === nextSatIso
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                              }`}
                            >
                              Sábado
                            </button>
                            <button
                              type="button"
                              onClick={() => setPromisedDate(nextMonIso)}
                              className={`text-xs font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                                promisedDate === nextMonIso
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                              }`}
                            >
                              Próx. Lunes
                            </button>
                            <button
                              type="button"
                              onClick={() => setPromisedDate(in7DaysIso)}
                              className={`text-xs font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                                promisedDate === in7DaysIso
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                              }`}
                            >
                              En 1 semana
                            </button>
                            <button
                              type="button"
                              onClick={() => setPromisedDate(endMonthIso)}
                              className={`text-xs font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                                promisedDate === endMonthIso
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                              }`}
                            >
                              Fin de mes
                            </button>
                          </div>
                        </div>

                        {/* Selector de Hora / Franja Horaria con Opción Personalizada */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-amber-950 block">
                            Hora o Franja de Cobro:
                          </label>
                          <select
                            value={isCustomTime ? 'custom' : promisedTime}
                            onChange={(e) => {
                              if (e.target.value === 'custom') {
                                setIsCustomTime(true);
                              } else {
                                setIsCustomTime(false);
                                setPromisedTime(e.target.value);
                              }
                            }}
                            className="w-full text-xs sm:text-sm font-black px-3 py-2 bg-white border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer shadow-2xs"
                          >
                            <option value="Mañana (8:00 - 11:00)">Mañana (8:00 - 11:00)</option>
                            <option value="Mediodía (11:00 - 13:00)">Mediodía (11:00 - 13:00)</option>
                            <option value="Tarde (13:00 - 16:00)">Tarde (13:00 - 16:00)</option>
                            <option value="Final de ruta (16:00 - 19:00)">Final de ruta (16:00 - 19:00)</option>
                            <option value="custom">✍️ Hora exacta pactada (Personalizada)...</option>
                          </select>

                          {isCustomTime && (
                            <div className="pt-1.5 animate-in fade-in duration-150">
                              <input
                                type="text"
                                placeholder="Ej: 10:30 AM, o después del almuerzo"
                                value={customTimeInput}
                                onChange={(e) => setCustomTimeInput(e.target.value)}
                                className="w-full text-xs sm:text-sm font-black px-3 py-2 bg-white border-2 border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden shadow-2xs placeholder:text-amber-900/40"
                                autoFocus
                              />
                            </div>
                          )}

                          <div className="flex items-center space-x-1 text-xs text-amber-800 font-bold mt-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Se guarda en PostgreSQL (Supabase), cartera y recibo.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-black text-slate-700 block">
                  Instrucciones o nota de entrega:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Entregar antes de las 11:00 o dejar con la encargada"
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer with iOS Safe-Area support */}
        {!createdOrderSummary && cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-3 sticky bottom-0 z-20 shadow-lg pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {debtBalance === 0
                    ? `Cobro Total (${cartTotalBottles} botellas):`
                    : numericPaid > 0
                    ? `A Cobrar Hoy (${paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'deuna' ? 'DeUna' : 'Transferencia'}):`
                    : 'Venta 100% a Crédito:'}
                </span>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      debtBalance === 0
                        ? 'text-blue-700'
                        : numericPaid > 0
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {debtBalance === 0
                      ? formatCurrency(cartTotalAmount)
                      : formatCurrency(numericPaid)}
                  </span>

                  {debtBalance > 0 && (
                    <span className="text-xs font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                      + {formatCurrency(debtBalance)} a Cartera
                    </span>
                  )}
                </div>
              </div>

              {debtBalance > 0 && (
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-bold block">Total Pedido:</span>
                  <span className="font-mono text-sm sm:text-base font-black text-slate-700">
                    {formatCurrency(cartTotalAmount)}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={handleConfirmOrder}
              className={`w-full py-4 px-5 active:scale-97 text-white font-black rounded-2xl text-base sm:text-lg shadow-md flex items-center justify-center space-x-2 transition-transform duration-150 ease-out disabled:opacity-50 cursor-pointer ${
                debtBalance > 0 && numericPaid === 0
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : saleType === 'autoventa'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <span>
                {debtBalance === 0
                  ? (saleType === 'autoventa'
                      ? `Confirmar y Despachar (${formatCurrency(cartTotalAmount)})`
                      : `Programar Pedido (${formatCurrency(cartTotalAmount)})`)
                  : numericPaid > 0
                  ? `Cobrar ${formatCurrency(numericPaid)} + Dejar ${formatCurrency(debtBalance)} a Crédito`
                  : `Confirmar Venta a Crédito (${formatCurrency(cartTotalAmount)})`}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      {showThermalModal && createdOrder && (
        <ThermalReceiptModal
          isOpen={showThermalModal}
          onClose={() => setShowThermalModal(false)}
          order={createdOrder}
          client={activeClient}
          invoice={invoices.find((i) => i.orderId === createdOrder.id || i.id === createdOrder.invoiceId)}
        />
      )}
    </>
  );
}
