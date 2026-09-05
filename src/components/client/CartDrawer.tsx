'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDistribution } from '@/context/DistributionContext';
import { formatCurrency } from '@/lib/utils/formatters';
import { SaleTypeBadgeSelector } from '@/components/order/SaleTypeBadgeSelector';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Banknote,
  Building2,
  CreditCard,
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
} from 'lucide-react';
import { PaymentMethod, SaleType, Invoice } from '@/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  onOrderSuccess?: (orderId: string) => void;
}

export function CartDrawer({ isOpen, onClose, clientId, onOrderSuccess }: CartDrawerProps) {
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
  } = useDistribution();

  const activeClient = clients.find((c) => c.id === (clientId || selectedClientId)) || clients[0];

  const [saleType, setSaleType] = useState<SaleType>('autoventa');
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
  const [notes, setNotes] = useState<string>('');
  const [addressRef, setAddressRef] = useState<string>(activeClient?.addressReference || '');
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
  const [mounted, setMounted] = useState<boolean>(false);
  const [copiedBank, setCopiedBank] = useState<boolean>(false);
  const [copiedDeuna, setCopiedDeuna] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    if (cartTotalAmount > 0 && paymentMethod !== 'credit') {
      setAmountPaidInput(cartTotalAmount.toFixed(2));
    }
  }, [cartTotalAmount, isOpen, paymentMethod]);

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'credit') {
      setAmountPaidInput('0.00');
    } else {
      setAmountPaidInput(cartTotalAmount.toFixed(2));
    }
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
        amountPaid: numericPaid,
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
              <h2 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                {createdOrderSummary ? 'Comprobante de Venta' : 'Revisar & Cobrar Pedido'}
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                {activeClient?.businessName || activeClient?.fullName}
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
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-md transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar Comprobante por WhatsApp</span>
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
              {/* SALE TYPE SELECTOR */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Modalidad de Venta
                </label>
                <SaleTypeBadgeSelector value={saleType} onChange={setSaleType} />
              </div>

              {/* Preventa Schedule Picker */}
              {saleType === 'preventa' && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                    Programación de Entrega
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-emerald-800 block mb-1">Fecha de Entrega:</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full text-xs font-bold px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-emerald-800 block mb-1">Franja Horaria:</label>
                      <select
                        value={scheduledTimeSlot}
                        onChange={(e) => setScheduledTimeSlot(e.target.value)}
                        className="w-full text-xs font-bold px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
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
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                  Productos en el Pedido • {cartTotalBottles} {cartTotalBottles === 1 ? 'botella' : 'botellas'}
                </span>

                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-sm sm:text-base text-slate-900">
                            {item.beverageType} • {item.container}
                          </span>
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black px-2 py-0.5 rounded-md">
                            {item.size}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600">
                          {item.flavorType === 'single' ? (
                            <span className="font-bold">
                              Sabor: <strong className="text-slate-900">{item.selectedFlavor}</strong>
                            </span>
                          ) : (
                            <div>
                              <span className="font-black text-blue-700 block">
                                {item.container === 'Vidrio' ? 'Java Surtida:' : 'Pack Surtido:'}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {item.surtidoDetails &&
                                  Object.entries(item.surtidoDetails).map(([fl, qty]) => (
                                    <span
                                      key={fl}
                                      className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] text-slate-800 font-black"
                                    >
                                      {qty}x {fl}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-mono font-black text-blue-700 block">
                          {formatCurrency(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Steppers */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-black text-slate-700 px-1">
                          {item.container === 'Vidrio' ? 'Javas:' : 'Packs:'}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantityJavas - 1, item.quantityUnits)}
                          className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-800 font-black shadow-2xs active:scale-95"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-black font-mono text-slate-900">
                          {item.quantityJavas}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantityJavas + 1, item.quantityUnits)}
                          className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-800 font-black shadow-2xs active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-black text-slate-700 px-1">Sueltas:</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantityJavas, item.quantityUnits - 1)}
                          className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-800 font-black shadow-2xs active:scale-95"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-black font-mono text-slate-900">
                          {item.quantityUnits}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantityJavas, item.quantityUnits + 1)}
                          className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-800 font-black shadow-2xs active:scale-95"
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
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('cash')}
                    className={`p-3 rounded-2xl border flex items-center space-x-2.5 text-left transition-all active:scale-95 cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-black">Efectivo</div>
                      <div className="text-[10px] text-slate-500">Cobro de contado</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('deuna')}
                    className={`p-3 rounded-2xl border flex items-center space-x-2.5 text-left transition-all active:scale-95 cursor-pointer ${
                      paymentMethod === 'deuna'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Zap className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <div className="text-xs font-black">DeUna</div>
                      <div className="text-[10px] text-slate-500">QR / Celular directo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('transfer')}
                    className={`p-3 rounded-2xl border flex items-center space-x-2.5 text-left transition-all active:scale-95 cursor-pointer ${
                      paymentMethod === 'transfer'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <div className="text-xs font-black">Transferencia</div>
                      <div className="text-[10px] text-slate-500">Banco Pichincha</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('credit')}
                    className={`p-3 rounded-2xl border flex items-center space-x-2.5 text-left transition-all active:scale-95 cursor-pointer ${
                      paymentMethod === 'credit'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-black">Crédito</div>
                      <div className="text-[10px] text-slate-500">Cartera por cobrar</div>
                    </div>
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

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-blue-100 font-medium">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">Banco:</span>
                        <span className="font-black text-slate-800">Banco Pichincha</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">Tipo:</span>
                        <span className="font-bold text-slate-800">Ahorros</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">N° Cuenta:</span>
                        <span className="font-mono font-black text-blue-700 select-all">2204567890</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">Cédula / RUC:</span>
                        <span className="font-mono font-bold text-slate-800 select-all">1803013810</span>
                      </div>
                      <div className="col-span-2 pt-1.5 border-t border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold">Titular:</span>
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
                        <span className="text-slate-400 block text-[10px] font-bold">Número Celular DeUna:</span>
                        <span className="font-mono text-base font-black text-purple-950 select-all">096 390 6286</span>
                        <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                          Titular: Ana Andrade
                        </span>
                      </div>
                      <div className="px-2.5 py-1 bg-purple-100 text-purple-800 font-black text-[11px] rounded-lg">
                        Sin comisión
                      </div>
                    </div>
                  </div>
                )}

                {/* CRÉDITO: AVISO CARTERA POR COBRAR */}
                {paymentMethod === 'credit' && (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center space-x-1.5 text-amber-900 font-black text-xs uppercase tracking-wider">
                      <CreditCard className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Venta a Crédito • Cartera por Cobrar</span>
                    </div>
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      El valor de <strong className="font-mono font-black text-amber-950">{formatCurrency(cartTotalAmount)}</strong> quedará registrado en la cartera deudora de <strong className="text-slate-900">{activeClient?.businessName || activeClient?.fullName}</strong>.
                    </p>
                  </div>
                )}

                {/* Monto Recibido / Pagado ($) Input */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800">
                      Monto Recibido / Pagado ($):
                    </label>
                    <button
                      type="button"
                      onClick={() => setAmountPaidInput(cartTotalAmount.toFixed(2))}
                      className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Pagar Total (${cartTotalAmount.toFixed(2)})
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={cartTotalAmount}
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      className="w-full text-lg font-black font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {debtBalance === 0 ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center justify-between">
                      <span className="flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                        Pago Completo • Cancelado en su totalidad
                      </span>
                      <span className="font-mono text-xs font-black text-emerald-700">$0.00 pendiente</span>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-700 shrink-0" />
                          Programar Cobro del Saldo
                        </span>
                        <span className="font-mono text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-lg">
                          {formatCurrency(debtBalance)} a cobrar
                        </span>
                      </div>

                      <p className="text-xs text-amber-900 font-medium">
                        ¿Cuándo y a qué hora pasas cobrando el saldo restante a <strong className="text-slate-900">{activeClient?.businessName || activeClient?.fullName}</strong>?
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="text-[11px] font-black text-amber-900 block mb-1">
                            Fecha de Cobranza:
                          </label>
                          <input
                            type="date"
                            value={promisedDate}
                            onChange={(e) => setPromisedDate(e.target.value)}
                            className="w-full text-xs font-black px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                setPromisedDate(new Date(Date.now() + 86400000).toISOString().split('T')[0])
                              }
                              className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md transition-colors cursor-pointer"
                            >
                              Mañana
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPromisedDate(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0])
                              }
                              className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md transition-colors cursor-pointer"
                            >
                              En 3 días
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPromisedDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
                              }
                              className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md transition-colors cursor-pointer"
                            >
                              En 1 semana
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-black text-amber-900 block mb-1">
                            Hora o Franja de Cobro:
                          </label>
                          <select
                            value={promisedTime}
                            onChange={(e) => setPromisedTime(e.target.value)}
                            className="w-full text-xs font-black px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                          >
                            <option value="Mañana (8:00 - 11:00)">Mañana (8:00 - 11:00)</option>
                            <option value="Mediodía (11:00 - 13:00)">Mediodía (11:00 - 13:00)</option>
                            <option value="Tarde (13:00 - 16:00)">Tarde (13:00 - 16:00)</option>
                            <option value="Final de ruta (16:00 - 19:00)">Final de ruta (16:00 - 19:00)</option>
                          </select>
                          <p className="text-[10px] text-amber-700 font-medium mt-1.5">
                            Quedará registrado en cartera y en el comprobante.
                          </p>
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

        {/* Modal Sticky Footer */}
        {!createdOrderSummary && cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-3 sticky bottom-0 z-20 shadow-lg">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
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
                  <span className="text-[11px] text-slate-400 font-bold block">Total Pedido:</span>
                  <span className="font-mono text-sm font-black text-slate-700">
                    {formatCurrency(cartTotalAmount)}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={handleConfirmOrder}
              className={`w-full py-4 px-5 active:scale-[0.98] text-white font-black rounded-2xl text-base sm:text-lg shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer ${
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

  return createPortal(modalContent, document.body);
}
