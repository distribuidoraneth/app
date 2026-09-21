'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Order, Client, Invoice } from '@/types';
import { formatCurrency, formatItemTitle } from '@/lib/utils/formatters';
import { DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import { PoplQRCodeSVG } from '@/components/ui/PoplQRCodeSVG';
import { AnethReceiptLogo } from './AnethReceiptLogo';
import { Printer, X } from 'lucide-react';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  client?: Client | null;
  invoice?: Invoice | null;
}

export function ThermalReceiptModal({
  isOpen,
  onClose,
  order,
  client,
  invoice,
}: ThermalReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const clientName =
    client?.businessName ||
    order.businessName ||
    client?.fullName ||
    order.clientName ||
    'CONSUMIDOR FINAL';

  const clientTaxId =
    client?.taxId || (order as any).clientTaxId || (invoice ? invoice.clientTaxId : '9999999999999');

  const clientPhone =
    client?.whatsappNumber || order.whatsappNumber || '';

  const clientAddress =
    client?.addressReference || order.addressReference || '';

  const orderDate = new Date(order.createdAt);
  const formattedDate = `${orderDate.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })} ${orderDate.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;

  // Use readable order/invoice number rather than raw internal ID
  const cleanRef = invoice?.invoiceNumber || order.invoiceNumber || order.orderNumber;
  const digitalInvoiceUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/factura/${cleanRef}`
    : `https://distribuidora-aneth.vercel.app/factura/${cleanRef}`;

  const hasDebt = order.debtBalance > 0;

  const formatPromisedDate = (dateStr?: string) => {
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

  const paymentMethodLabel =
    order.paymentMethod === 'cash'
      ? 'EFECTIVO'
      : order.paymentMethod === 'deuna'
      ? 'DEUNA'
      : order.paymentMethod === 'transfer'
      ? 'TRANSFERENCIA'
      : 'CRÉDITO';

  const subtotal15 = Number((order.totalAmount / 1.15).toFixed(2));
  const tax15 = Number((order.totalAmount - subtotal15).toFixed(2));

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex sm:items-center items-end justify-center bg-black/60 backdrop-blur-sm sm:backdrop-blur-md p-0 sm:p-4 overflow-hidden print:p-0 print:bg-white print:fixed print:inset-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Estilos ultra-optimizados para RawBT y cabezal térmico Munbyn 58mm (48mm imprimible / 384 dots) */}
      <style>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0mm;
          }
          html, body {
            width: 48mm !important;
            max-width: 48mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * {
            visibility: hidden !important;
          }
          #thermal-printable-receipt,
          #thermal-printable-receipt * {
            visibility: visible !important;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            color: #000000 !important;
            -webkit-text-stroke: 0 !important;
            text-shadow: none !important;
            letter-spacing: 0 !important;
            box-sizing: border-box !important;
          }
          #thermal-printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 48mm !important;
            max-width: 48mm !important;
            min-width: 48mm !important;
            padding: 0.5mm 0.5mm 6mm 0.5mm !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 9.5px !important;
            line-height: 1.2 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          /* Control estricto de pesos tipográficos para Munbyn 58mm / RawBT */
          #thermal-printable-receipt,
          #thermal-printable-receipt p,
          #thermal-printable-receipt span,
          #thermal-printable-receipt div {
            font-weight: 400 !important;
          }
          #thermal-printable-receipt .font-semibold,
          #thermal-printable-receipt .font-bold {
            font-weight: 700 !important;
          }
          #thermal-printable-receipt .font-mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            font-weight: 600 !important;
          }
          #thermal-printable-receipt * {
            border-color: #000000 !important;
          }
          .no-thermal-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Sheet Container: Apple Bottom Sheet on Mobile / Glass Card on Desktop */}
      <div
        className="w-full sm:max-w-[360px] bg-white sm:rounded-3xl rounded-t-[32px] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[86vh] overflow-hidden border border-slate-200/80 animate-in slide-in-from-bottom duration-250 ease-out sm:zoom-in-95 print:border-none print:shadow-none print:m-0 print:w-[48mm] print:max-w-[48mm] print:max-h-none print:rounded-none print:bg-white print:overflow-visible"
        role="dialog"
        aria-modal="true"
        aria-labelledby="thermal-receipt-title"
      >
        {/* Mobile Apple Drag Handle Pill */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden no-thermal-print shrink-0" />

        {/* Barra superior estilo Apple con frosted glass */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between no-thermal-print shrink-0 z-10">
          <div>
            <h2 id="thermal-receipt-title" className="text-xs font-bold text-slate-900 leading-tight">
              Recibo Térmico (58mm)
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">
              Munbyn • 48mm Imprimible
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0062cc] active:scale-95 text-white rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all duration-150 ease-out cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Cerrar recibo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Contenedor con scroll suave y relleno inferior generoso para móviles */}
        <div className="p-3 sm:p-4 overflow-y-auto overscroll-contain flex justify-center flex-1 bg-slate-100/70 pb-12 sm:pb-8 print:p-0 print:bg-white print:overflow-visible">
          {/* TICKET IMPRIMIBLE 58MM (48mm área útil) */}
          <div
            id="thermal-printable-receipt"
            ref={receiptRef}
            className="w-[260px] print:w-[48mm] bg-white text-black p-3 pb-4 shadow-sm border border-slate-200/60 rounded-xs font-sans text-[10px] leading-[1.2] tracking-tight select-all print:shadow-none print:border-none print:p-0 print:pb-0"
          >
            {/* LOGOTIPO OFICIAL ANETH DISTRIBUCIONES */}
            <div className="text-center pt-0.5 pb-1">
              <AnethReceiptLogo className="w-28 h-auto mx-auto mb-1" />
              <p className="font-bold text-[11px] uppercase tracking-tight text-slate-900 leading-tight">
                ANETH Distribuciones
              </p>
              <p className="text-[9px] text-slate-800 leading-tight">
                {DEFAULT_TAX_PROFILE.razonSocial}
              </p>
              <p className="font-semibold text-[10px] pt-0.5">
                RUC: {DEFAULT_TAX_PROFILE.ruc}
              </p>
              <p className="text-[8.5px] text-slate-600">
                Ambato - Ecuador
              </p>
              <div className="border-b border-black my-1.5" />
            </div>

            {/* COMPROBANTE Y FECHA */}
            <div className="space-y-0.5 text-[9.5px]">
              <div className="flex justify-between font-semibold">
                <span>PEDIDO:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>FECHA:</span>
                <span>{formattedDate}</span>
              </div>
              {invoice?.invoiceNumber && (
                <div className="flex justify-between font-semibold">
                  <span>FACTURA SRI:</span>
                  <span>{invoice.invoiceNumber}</span>
                </div>
              )}
            </div>

            {/* DATOS DEL CLIENTE */}
            <div className="border-t border-dashed border-black pt-1 mt-1 space-y-0.5 text-[9.5px]">
              <p className="font-bold uppercase leading-tight">CLIENTE: {clientName}</p>
              <p><span className="font-semibold">C.I./RUC:</span> {clientTaxId}</p>
              {clientPhone && <p><span className="font-semibold">TEL:</span> {clientPhone}</p>}
              {clientAddress && (
                <p className="leading-tight truncate"><span className="font-semibold">DIR:</span> {clientAddress}</p>
              )}
            </div>

            {/* TABLA DE PRODUCTOS (3 COLUMNAS LIMPIAS PARA MUNBYN 48MM) */}
            <div className="border-t border-black pt-1 mt-1.5 mb-1">
              <div className="flex justify-between font-bold text-[9.5px] border-b border-black pb-0.5 mb-1 tracking-tight">
                <span className="w-12 text-left">CANT</span>
                <span className="flex-1 text-left px-1">DESCRIPCIÓN</span>
                <span className="w-12 text-right">TOTAL</span>
              </div>

              {/* LISTA DE ITEMS DESGLOSADOS */}
              <div className="space-y-1 text-[9.5px]">
                {order.items.map((it, idx) => {
                  const hasJavas = it.quantityJavas > 0;
                  const hasUnits = (it.quantityUnits || 0) > 0;
                  const effectivePricePerUnit = it.pricePerUnit > 0
                    ? it.pricePerUnit
                    : Number(((it.pricePerJava || 0) / (it.unitsPerJava || 12)).toFixed(4));

                  const packSubtotal = Number((it.quantityJavas * it.pricePerJava).toFixed(2));
                  const unitSubtotal = hasJavas
                    ? Number((it.subtotal - packSubtotal).toFixed(2))
                    : Number(((it.quantityUnits || 0) * effectivePricePerUnit).toFixed(2));

                  const flavorDesc =
                    it.flavorType === 'single'
                      ? it.selectedFlavor
                      : it.surtidoDetails
                      ? Object.entries(it.surtidoDetails)
                          .map(([f, q]) => `${q} ${f}`)
                          .join(',')
                      : 'Surtido';

                  const packType = it.container === 'Vidrio' ? 'JAV' : 'PAK';

                  return (
                    <React.Fragment key={idx}>
                      {/* Línea de Paquete / Java */}
                      {hasJavas && (
                        <div className="pb-0.5 border-b border-dashed border-slate-200">
                          <div className="flex justify-between items-start leading-tight">
                            <span className="w-12 font-bold">{it.quantityJavas} {packType}</span>
                            <span className="flex-1 text-left px-1 font-semibold leading-tight">
                              {it.brand || 'Fructi'} {it.size}
                            </span>
                            <span className="w-12 text-right font-bold font-mono text-[9px]">
                              ${packSubtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="pl-12 text-[8.5px] text-slate-700 leading-tight">
                            {flavorDesc} • {it.quantityJavas * it.unitsPerJava} und • ${it.pricePerJava.toFixed(2)}/p
                          </div>
                        </div>
                      )}

                      {/* Línea de Unidad Suelta */}
                      {hasUnits && (
                        <div className="pb-0.5 border-b border-dashed border-slate-200">
                          <div className="flex justify-between items-start leading-tight">
                            <span className="w-12 font-bold">{it.quantityUnits} UNI</span>
                            <span className="flex-1 text-left px-1 font-semibold leading-tight">
                              {it.brand || 'Fructi'} {it.size} {it.container}
                            </span>
                            <span className="w-12 text-right font-bold font-mono text-[9px]">
                              ${unitSubtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="pl-12 text-[8.5px] text-slate-700 leading-tight">
                            {it.flavorType === 'single' ? it.selectedFlavor : 'Surtido'} • ${effectivePricePerUnit.toFixed(2)} c/u
                          </div>
                        </div>
                      )}

                      {/* Fallback para pedidos históricos */}
                      {!hasJavas && !hasUnits && (
                        <div className="pb-0.5 border-b border-dashed border-slate-200">
                          <div className="flex justify-between items-start leading-tight">
                            <span className="w-12 font-bold">{it.totalBottles || 1} UNI</span>
                            <span className="flex-1 text-left px-1 font-semibold leading-tight">
                              {formatItemTitle(it)}
                            </span>
                            <span className="w-12 text-right font-bold font-mono text-[9px]">
                              ${it.subtotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* TOTALES */}
            <div className="border-t border-dashed border-black pt-1 my-1 space-y-0.5 text-[9.5px]">
              <div className="flex justify-between">
                <span>SUBTOTAL (15%):</span>
                <span className="font-mono font-semibold">${subtotal15.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA 15%:</span>
                <span className="font-mono font-semibold">${tax15.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-[11px] border-y border-black py-0.5 my-1">
                <span>TOTAL A PAGAR:</span>
                <span className="font-mono font-bold">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">FORMA DE PAGO:</span>
                <span className="font-bold">{paymentMethodLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>COBRADO HOY:</span>
                <span className="font-mono font-semibold">${order.amountPaid.toFixed(2)}</span>
              </div>

              {hasDebt ? (
                <div className="border border-black p-1.5 my-1 text-left bg-slate-50 print:bg-transparent">
                  <div className="flex justify-between font-bold text-[10.5px]">
                    <span>SALDO PENDIENTE:</span>
                    <span className="font-mono font-bold">${order.debtBalance.toFixed(2)}</span>
                  </div>
                  {(order.promisedCollectionDate || order.promisedCollectionTime) && (
                    <p className="text-[8.5px] mt-0.5">
                      <span className="font-semibold">Compromiso:</span>{' '}
                      {formatPromisedDate(order.promisedCollectionDate)}{' '}
                      {order.promisedCollectionTime ? `(${order.promisedCollectionTime})` : ''}
                    </p>
                  )}
                  {/* Firma de conformidad */}
                  <div className="pt-5 mt-1 border-t border-dashed border-black text-center">
                    <div className="border-b border-black w-36 mx-auto mb-0.5" />
                    <p className="text-[8px] uppercase font-bold">Firma Cliente: {clientName}</p>
                    <p className="text-[7.5px] text-slate-600">C.I./RUC: {clientTaxId}</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between font-bold text-[9.5px] pt-0.5">
                  <span>ESTADO:</span>
                  <span>PAGADO COMPLETO</span>
                </div>
              )}
            </div>

            {/* CÓDIGO QR POPL COMPACTO (FACTURA DIGITAL SRI) */}
            <div className="mt-2 pt-1.5 border-t border-dashed border-black text-center space-y-0.5">
              <div className="flex justify-center py-0.5">
                <PoplQRCodeSVG
                  value={digitalInvoiceUrl}
                  size={72}
                  color="#000000"
                  bgColor="#ffffff"
                />
              </div>
              <p className="font-bold text-[8.5px] uppercase tracking-tight leading-tight">
                Factura Electrónica SRI
              </p>
              <p className="text-[7.5px] text-slate-600 leading-tight">
                Escanee para ver o descargar comprobante
              </p>
            </div>

            {/* PIE DE TICKET */}
            <div className="mt-1.5 pt-1 border-t border-black text-center text-[8.5px]">
              <p className="font-bold uppercase tracking-tight">¡Gracias por su preferencia!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
