'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDistribution } from '@/context/DistributionContext';
import { formatCurrency } from '@/lib/utils/formatters';
import confetti from 'canvas-confetti';
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
} from 'lucide-react';
import { PaymentMethod } from '@/types';

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
  } = useDistribution();

  const activeClient = clients.find((c) => c.id === (clientId || selectedClientId)) || clients[0];

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState<string>('');
  const [addressRef, setAddressRef] = useState<string>(activeClient?.addressReference || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleConfirmOrder = () => {
    if (cart.length === 0 || !activeClient) return;

    setIsSubmitting(true);

    try {
      const order = createOrder({
        clientId: activeClient.id,
        items: cart,
        paymentMethod: paymentMethod,
        notes: notes,
        customLocation: {
          latitude: activeClient.latitude,
          longitude: activeClient.longitude,
          addressReference: addressRef,
        },
      });

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      setIsSubmitting(false);
      onClose();
      onOrderSuccess?.(order.id);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center sm:p-4 overflow-y-auto">
      {/* Fullscreen Mobile View / Large Centered Modal on Desktop */}
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-xl bg-white sm:rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all active:scale-95 flex items-center space-x-1"
              title="Volver"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-black sm:hidden">Volver</span>
            </button>
            <div>
              <h2 className="font-black text-base sm:text-lg text-slate-900 leading-tight">Revisar Mi Pedido</h2>
              <p className="text-xs text-slate-500 font-bold">
                {activeClient?.businessName || activeClient?.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {cart.length > 0 && (
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
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#fafbfc]">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Package className="w-7 h-7" />
              </div>
              <p className="text-base font-black text-slate-800">El pedido está vacío</p>
              <p className="text-xs text-slate-500">Agrega javas o unidades desde el portal para continuar.</p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-xs hover:bg-blue-700 transition-all"
              >
                Ir a Comprar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Detalle del Pedido ({cartTotalBottles} botellas • {cartTotalJavas} javas, {cartTotalUnits} sueltas)
                </span>
              </div>

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-base text-slate-900">
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
                            <span className="font-black text-blue-700 block">Java Surtida:</span>
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

                      <div className="text-xs text-slate-500 font-medium">
                        {item.quantityJavas > 0 && <span>{item.quantityJavas} {item.quantityJavas === 1 ? 'java' : 'javas'} (${formatCurrency(item.pricePerJava)} c/u)</span>}
                        {item.quantityJavas > 0 && item.quantityUnits > 0 && <span> + </span>}
                        {item.quantityUnits > 0 && <span>{item.quantityUnits} {item.quantityUnits === 1 ? 'suelta' : 'sueltas'} (${formatCurrency(item.pricePerUnit)} c/u)</span>}
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
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stepper controls for Javas and Loose Units */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    {/* Javas modifier */}
                    <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-black text-slate-700 px-1">Javas:</span>
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

                    {/* Loose units modifier */}
                    <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-black text-slate-700 px-1">Unidades:</span>
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
          )}

          {cart.length > 0 && (
            <>
              {/* Forma de Pago */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Forma de Pago
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3.5 rounded-2xl border flex items-center space-x-2.5 text-left transition-all active:scale-95 ${
                      paymentMethod === 'cash'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-black">Efectivo</div>
                      <div className="text-[11px] text-slate-500 font-normal">Contra entrega</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-3.5 rounded-2xl border flex items-center space-x-2.5 text-left transition-all active:scale-95 ${
                      paymentMethod === 'transfer'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-black">Transferencia</div>
                      <div className="text-[11px] text-slate-500 font-normal">Bancaria o DeUna</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Ubicación y Dirección Registrada */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Dirección de Entrega del Local
                </label>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">{activeClient?.businessName}</p>
                  <p className="text-slate-600">{activeClient?.addressReference || 'Dirección registrada del establecimiento'}</p>
                </div>
              </div>

              {/* Notas de Entrega */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-black text-slate-700 block">
                  Instrucciones o nota adicional:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Entregar antes del mediodía o llamar al timbre"
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Sticky Footer */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-3 sticky bottom-0 z-20 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 font-bold block">
                  Total a Pagar ({cartTotalBottles} botellas):
                </span>
                <span className="text-2xl sm:text-3xl font-black text-blue-700 font-mono">
                  {formatCurrency(cartTotalAmount)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={handleConfirmOrder}
              className="w-full py-4 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black rounded-2xl text-base sm:text-lg shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>Confirmar y Enviar Pedido</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
