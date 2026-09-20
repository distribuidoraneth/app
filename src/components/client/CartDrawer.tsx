'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDistribution } from '@/context/DistributionContext';
import { formatCurrency, formatUnitPrice, formatItemTitle } from '@/lib/utils/formatters';
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
  QrCode,
  Maximize2,
} from 'lucide-react';
import { PaymentMethod, SaleType, Invoice, Order } from '@/types';
import { ThermalReceiptModal } from '@/components/receipt/ThermalReceiptModal';
import {
  AppleWhatsAppIcon,
  AppleTrashIcon,
  AppleBanknoteIcon,
  AppleBuildingClassicalIcon,
  AppleCalendarClockIcon,
  AppleCalendarIcon,
  ApplePencilIcon,
  AppleCheckmarkSealIcon,
  AppleLockIcon,
  renderFlavorThumbnail,
} from '@/components/ui/AppleIcons';


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
  const [promisedDate, setPromisedDate] = useState<string>('');
  const [promisedTime, setPromisedTime] = useState<string>('');
  const [tempDate, setTempDate] = useState<string>('');
  const [tempTime, setTempTime] = useState<string>('8:00 a 10:00 AM');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const WORK_TIME_SLOTS = [
    '8:00 a 10:00 AM',
    '10:00 a 12:00 PM',
    '1:00 a 3:00 PM',
    '3:00 a 5:00 PM',
  ];

  const todayIso = new Date().toISOString().split('T')[0];
  const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const in3DaysIso = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const in8DaysIso = new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0];

  const formatHumanDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);

      const formatted = date.toLocaleDateString('es-EC', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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
  const [showCreditModal, setShowCreditModal] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [copiedBank, setCopiedBank] = useState<boolean>(false);
  const [copiedDeuna, setCopiedDeuna] = useState<boolean>(false);
  const [showDeunaQrModal, setShowDeunaQrModal] = useState<boolean>(false);

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

  const handleSendBankDetailsWhatsApp = () => {
    let phone = activeClient?.whatsappNumber?.replace(/\D/g, '') || '';
    if (phone.startsWith('0')) {
      phone = '593' + phone.slice(1);
    } else if (phone && !phone.startsWith('593')) {
      phone = '593' + phone;
    }

    const clientName = activeClient?.businessName || activeClient?.fullName;
    const greeting = clientName ? `Hola *${clientName}*, le` : 'Estimado/a cliente, le';

    const text =
      `*DISTRIBUIDORA ANETH* 📦\n\n` +
      `${greeting} compartimos los datos bancarios para su transferencia:\n\n` +
      `🏦 *Banco:* Banco Pichincha\n` +
      `💳 *Tipo:* Cuenta de Ahorros\n` +
      `🔢 *N° de Cuenta:* 5982790700\n` +
      `🪪 *Cédula / RUC:* 1803013810\n` +
      `👤 *Titular:* ANDRADE CONSTANTE ANA ELIZABETH\n` +
      (cartTotalAmount > 0 ? `💰 *Valor a transferir:* $${cartTotalAmount.toFixed(2)}\n` : '') +
      `\n_Por favor nos comparte el comprobante una vez realizada la transferencia._`;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  if (!isOpen || !mounted) return null;

  const numericPaid = parseFloat(amountPaidInput) || 0;
  const debtBalance = Math.max(0, Number((cartTotalAmount - numericPaid).toFixed(2)));

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      try {
        if (typeof dateInputRef.current.showPicker === 'function') {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
        }
      } catch {
        dateInputRef.current.focus();
      }
    }
  };

  const openCreditModal = () => {
    setTempDate(promisedDate || tomorrowIso);
    setTempTime(promisedTime || '8:00 a 10:00 AM');
    setShowCreditModal(true);
  };

  const handleSaveCreditSchedule = () => {
    setPromisedDate(tempDate || tomorrowIso);
    setPromisedTime(tempTime || '8:00 a 10:00 AM');
    setShowCreditModal(false);
  };

  const handleConfirmOrder = () => {
    if (cart.length === 0 || !activeClient) return;

    if (debtBalance > 0 && (!promisedDate || !promisedTime)) {
      openCreditModal();
      return;
    }

    setIsSubmitting(true);

    try {
      const order = createOrder({
        clientId: activeClient.id,
        items: cart,
        paymentMethod,
        saleType,
        scheduledDeliveryDate: saleType === 'preventa' ? scheduledDate : undefined,
        scheduledTimeSlot: saleType === 'preventa' ? scheduledTimeSlot : undefined,
        promisedCollectionDate: debtBalance > 0 ? promisedDate : undefined,
        promisedCollectionTime: debtBalance > 0 ? promisedTime : undefined,
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
        ? `*Saldo Pendiente:* $${createdOrderSummary.debtBalance.toFixed(2)}\n*Fecha pactada de cobro:* ${formatHumanDate(createdOrderSummary.promisedCollectionDate) || 'Por coordinar'} (${createdOrderSummary.promisedCollectionTime || 'En ruta'})\n`
        : `*Estado:* Pagado Completo\n`) +
      (invoiceLink ? `\n*Factura Electrónica SRI:* ${invoiceLink}\n` : '') +
      `\n_Gracias por su preferencia - Aneth Distribuciones_`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center sm:p-4 overflow-y-auto">
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-xl bg-white sm:rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 grid grid-cols-[auto_1fr_auto] items-center gap-2 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={handleCloseAll}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
              aria-label="Volver"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center text-center min-w-0 px-1">
            <div className="flex items-center justify-center space-x-2">
              <h2 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                {createdOrderSummary ? 'Comprobante' : 'Pedido'}
              </h2>
              {createdOrderSummary ? (
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {createdOrderSummary.orderNumber}
                </span>
              ) : (
                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Nuevo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium flex items-center justify-center gap-1.5 mt-0.5 truncate max-w-full">
              <span className="font-bold text-slate-800 truncate">
                {activeClient?.businessName || activeClient?.fullName || 'Cliente'}
              </span>
              {activeClient?.taxId && (
                <span className="font-mono text-slate-500 shrink-0">
                  • {activeClient.taxId}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleCloseAll}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Cerrar"
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
                          {formatHumanDate(createdOrderSummary.promisedCollectionDate)} • {createdOrderSummary.promisedCollectionTime}
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
                  Detalle
                </span>

                {cart.map((item) => {
                  const totalUnits = (item.quantityJavas * item.unitsPerJava) + item.quantityUnits;
                  const packs = Math.floor(totalUnits / item.unitsPerJava);
                  const loose = totalUnits % item.unitsPerJava;
                  const packLabel = item.container === 'Vidrio' 
                    ? (packs === 1 ? 'Java' : 'Javas') 
                    : (packs === 1 ? 'Pack' : 'Packs');
                  const packSubtotal = packs * item.pricePerJava;
                  const looseSubtotal = loose * item.pricePerUnit;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-black text-sm sm:text-base text-slate-900 inline-flex items-center gap-1.5">
                              <span>{formatItemTitle(item)}</span>
                              {item.flavorType !== 'surtido' && item.selectedFlavor && renderFlavorThumbnail(item.selectedFlavor, 20)}
                            </span>
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-2 py-0.5 rounded-md">
                              {item.unitsPerJava} und
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
                                    className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-xs text-slate-800 font-bold inline-flex items-center gap-1"
                                  >
                                    {renderFlavorThumbnail(fl, 16)}
                                    {qty}x {fl}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-right flex items-center space-x-2.5">
                          <span className="text-base sm:text-lg font-mono font-black text-blue-700 block">
                            {formatCurrency(item.subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-600 p-1 transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <AppleTrashIcon size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Clear Breakdown: Packs and Loose units */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-slate-600 font-medium">
                          {packs > 0 && loose > 0 ? (
                            <>
                              <span className="font-bold text-slate-800">
                                {packs} {packLabel} <span className="text-slate-500 font-normal">({formatCurrency(packSubtotal)})</span>
                              </span>
                              <span className="text-slate-400">+</span>
                              <span className="font-bold text-slate-800">
                                {loose} {loose === 1 ? 'Unidad' : 'Unidades'} <span className="text-slate-500 font-normal">({formatCurrency(looseSubtotal)})</span>
                              </span>
                            </>
                          ) : packs > 0 ? (
                            <span className="font-bold text-slate-800">
                              {packs} {packLabel} <span className="text-slate-500 font-normal">• {formatCurrency(item.pricePerJava)} c/u</span>
                            </span>
                          ) : loose > 0 ? (
                            <span className="font-bold text-slate-800">
                              {loose} {loose === 1 ? 'Unidad' : 'Unidades'} <span className="text-slate-500 font-normal">• {formatUnitPrice(item.pricePerUnit)} c/u</span>
                            </span>
                          ) : null}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            Total: {totalUnits} und
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    className={`py-3 px-2 rounded-2xl border flex items-center justify-center space-x-1.5 transition-all active:scale-95 cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <AppleBanknoteIcon size={18} className="shrink-0 text-emerald-600" />
                    <span className="text-xs sm:text-[13px] font-bold">Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('deuna')}
                    className={`py-3 px-2 rounded-2xl border flex items-center justify-center space-x-1.5 transition-all active:scale-95 cursor-pointer ${
                      paymentMethod === 'deuna'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <img
                      src="/icons/d1-purple-only.png"
                      alt="DeUna"
                      className="w-[18px] h-[18px] object-contain shrink-0"
                    />
                    <span className="text-xs sm:text-[13px] font-bold">DeUna</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('transfer')}
                    className={`py-3 px-2 rounded-2xl border flex items-center justify-center space-x-1.5 transition-all active:scale-95 cursor-pointer ${
                      paymentMethod === 'transfer'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <AppleBuildingClassicalIcon size={18} className="shrink-0 text-blue-600" />
                    <span className="text-xs sm:text-[13px] font-bold">Transferencia</span>
                  </button>
                </div>

                {/* TRANSFERENCIA BANCARIA: DATOS A LA MANO */}
                {paymentMethod === 'transfer' && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200/90 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="text-xs sm:text-sm font-black text-blue-950 truncate">Banco Pichincha</span>
                        <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 bg-blue-100/90 text-blue-800 rounded-md shrink-0">
                          Ahorros
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleSendBankDetailsWhatsApp}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200/90 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                          title="Enviar datos bancarios al cliente por WhatsApp"
                        >
                          <AppleWhatsAppIcon size={14} alt="WhatsApp" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `Banco Pichincha - Cuenta de Ahorros\nCta: 5982790700\nTitular: ANDRADE CONSTANTE ANA ELIZABETH\nCI: 1803013810`,
                              'bank'
                            )
                          }
                          className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-black flex items-center space-x-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          {copiedBank ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-blue-600" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm font-medium pt-2 border-t border-blue-100">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-bold">N° Cuenta:</span>
                        <span className="font-mono font-black text-blue-700 select-all text-sm sm:text-base">
                          5982790700
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-bold">Cédula / RUC:</span>
                        <span className="font-mono font-bold text-slate-800 select-all">1803013810</span>
                      </div>
                      <div className="col-span-2 pt-1.5 border-t border-blue-100/70">
                        <span className="text-slate-400 block text-[11px] font-bold">Titular:</span>
                        <span className="font-black text-slate-900">ANDRADE CONSTANTE ANA ELIZABETH</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* DEUNA: SOLO EL QR POPL ULTRA SIMPLIFICADO */}
                {paymentMethod === 'deuna' && (
                  <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-purple-100/80 rounded-3xl shadow-xs animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => setShowDeunaQrModal(true)}
                      className="relative group p-1.5 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-98 cursor-pointer focus:outline-hidden"
                      title="Toca para ampliar el código QR"
                    >
                      <img
                        src="/icons/qr-deuna.svg"
                        alt="Código QR DeUna Oficial"
                        className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-2xl"
                      />
                      <div className="absolute inset-0 bg-purple-950/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 bg-white/95 text-purple-950 text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-purple-700" />
                          <span>Ampliar</span>
                        </span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Monto Recibido Input */}
                <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <label className="text-xs font-black text-slate-800 block">
                    Monto Recibido
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-lg sm:text-xl font-bold text-slate-400 font-mono">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={cartTotalAmount}
                      value={amountPaidInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseFloat(val);
                        if (!isNaN(num) && num > cartTotalAmount) {
                          setAmountPaidInput(cartTotalAmount.toFixed(2));
                        } else {
                          setAmountPaidInput(val);
                        }
                      }}
                      placeholder={cartTotalAmount.toFixed(2)}
                      className="w-full text-lg sm:text-xl font-black font-mono pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-xs"
                    />
                  </div>

                  {debtBalance > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                      <div className="flex items-baseline gap-1.5 shrink-0">
                        <span className="text-xs font-semibold text-slate-500">
                          Saldo a crédito:
                        </span>
                        <span className="font-mono text-sm font-black text-slate-900">
                          {formatCurrency(debtBalance)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={openCreditModal}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 max-w-[210px] sm:max-w-none ${
                          promisedDate && promisedTime
                            ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 shadow-2xs'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-97'
                        }`}
                        title={promisedDate && promisedTime ? 'Cambiar fecha y hora de cobro' : 'Definir fecha de cobro'}
                      >
                        <AppleCalendarClockIcon size={13} className={promisedDate && promisedTime ? 'text-blue-600 shrink-0' : 'shrink-0'} />
                        <span className="truncate">
                          {promisedDate && promisedTime
                            ? `${formatHumanDate(promisedDate)} • ${promisedTime}`
                            : 'Definir fecha'}
                        </span>
                      </button>
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
            {/* Resumen de cobro y crédito */}
            {debtBalance > 0 ? (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Pedido:
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                    {formatCurrency(cartTotalAmount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Badge Cobro Hoy */}
                  <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 shadow-2xs">
                    <span className="text-xs font-bold text-emerald-700 block truncate">
                      Cobro Hoy
                    </span>
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-800 block mt-0.5">
                      {formatCurrency(numericPaid)}
                    </span>
                  </div>

                  {/* Badge Saldo a Crédito */}
                  <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl px-3.5 py-2.5 shadow-2xs">
                    <span className="text-xs font-bold text-amber-700 block truncate">
                      A Crédito
                    </span>
                    <span className="text-base sm:text-lg font-black font-mono text-amber-800 block mt-0.5">
                      {formatCurrency(debtBalance)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Total Pedido:
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-blue-700 block mt-0.5">
                    {formatCurrency(cartTotalAmount)}
                  </span>
                </div>
                <div className="text-right pb-1">
                  <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    Pago completo
                  </span>
                </div>
              </div>
            )}

            {(() => {
              const isCreditPendingDate = debtBalance > 0 && (!promisedDate || !promisedTime);

              return (
                <button
                  type="button"
                  disabled={isSubmitting || cart.length === 0}
                  onClick={
                    isCreditPendingDate
                      ? openCreditModal
                      : handleConfirmOrder
                  }
                  className={`w-full py-4 px-5 active:scale-98 font-black rounded-2xl text-base sm:text-lg flex items-center justify-center space-x-2 transition-all duration-150 ease-out disabled:opacity-50 cursor-pointer ${
                    isCreditPendingDate
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-600 border border-slate-300 shadow-none'
                      : saleType === 'autoventa'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  {isCreditPendingDate ? (
                    <>
                      <AppleLockIcon size={18} className="text-slate-500 shrink-0" />
                      <span>Definir Fecha de Cobro ({formatCurrency(debtBalance)})</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {saleType === 'autoventa'
                          ? 'Confirmar Despacho'
                          : 'Programar Pedido'}
                      </span>
                      <ArrowRight className="w-5 h-5 shrink-0" />
                    </>
                  )}
                </button>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );

  const creditModalContent = showCreditModal && (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setShowCreditModal(false)}
    >
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <AppleCalendarClockIcon size={20} />
            </div>
            <h3 className="text-base font-black text-slate-900">Fecha y Hora de Cobro</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowCreditModal(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de Fecha */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Fecha acordada
          </label>

          {/* Toda la tarjeta abre el calendario nativo directamente */}
          <div 
            onClick={handleOpenDatePicker}
            className="relative flex items-center bg-slate-50 hover:bg-slate-100 active:bg-slate-100/80 border border-slate-200 hover:border-blue-400 rounded-2xl px-4 py-3 cursor-pointer transition-all shadow-2xs group"
          >
            <AppleCalendarIcon size={18} className="text-blue-600 mr-3 shrink-0 group-hover:scale-105 transition-transform" />
            <input
              ref={dateInputRef}
              type="date"
              min={todayIso}
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              onClick={(e) => {
                try {
                  if (typeof (e.currentTarget as any).showPicker === 'function') {
                    (e.currentTarget as any).showPicker();
                  }
                } catch {}
              }}
              className="w-full text-sm sm:text-base font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Opciones rápidas de fecha: Mañana, En 3 días, En 8 días distribuidos en la fila */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: 'Mañana', val: tomorrowIso },
              { label: 'En 3 días', val: in3DaysIso },
              { label: 'En 8 días', val: in8DaysIso },
            ].map((shortcut) => (
              <button
                key={shortcut.label}
                type="button"
                onClick={() => setTempDate(shortcut.val)}
                className={`py-2.5 px-1 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer text-center truncate ${
                  tempDate === shortcut.val
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {shortcut.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Hora - Zonas de 2 horas sin redundancias */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Horario preferido
          </label>

          <div className="grid grid-cols-2 gap-2">
            {WORK_TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTempTime(slot)}
                className={`py-3 px-2 text-xs sm:text-sm font-bold rounded-xl border transition-all text-center cursor-pointer ${
                  tempTime === slot
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Botón Principal Guardar con espacio generoso */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSaveCreditSchedule}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Guardar Programación</span>
          </button>
        </div>
      </div>
    </div>
  );

  const deunaQrModalContent = showDeunaQrModal && (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setShowDeunaQrModal(false)}
    >
      <div
        className="relative bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-purple-100/80 flex flex-col items-center justify-center animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setShowDeunaQrModal(false)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <img
          src="/icons/qr-deuna.svg"
          alt="Código QR DeUna Oficial"
          className="w-72 h-72 sm:w-80 sm:h-80 object-contain rounded-2xl"
        />
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      {showCreditModal && createPortal(creditModalContent, document.body)}
      {showDeunaQrModal && createPortal(deunaQrModalContent, document.body)}
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
