'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Order, Client, Invoice } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import { PoplQRCodeSVG } from '@/components/ui/PoplQRCodeSVG';
import { AnethReceiptLogo } from './AnethReceiptLogo';
import { Printer, ArrowLeft } from 'lucide-react';

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

  // Bloquear el scroll del body en pantalla, pero desbloquearlo durante la impresión
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleBeforePrint = () => {
        document.body.style.overflow = 'visible';
      };
      const handleAfterPrint = () => {
        if (isOpen) {
          document.body.style.overflow = 'hidden';
        }
      };

      window.addEventListener('beforeprint', handleBeforePrint);
      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('beforeprint', handleBeforePrint);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isOpen]);

  // Tecla Escape para volver
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
    // Desbloquear temporalmente para que el motor de renderizado de impresión mida toda la altura sin cortes
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'visible';
    window.print();
    setTimeout(() => {
      if (isOpen) {
        document.body.style.overflow = prevOverflow || 'hidden';
      }
    }, 1200);
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

  // Formato sutil de línea: Fructi 500 ml Piña (solo se añade 'Vidrio' si no es plástico)
  const formatReceiptItemName = (it: any) => {
    const brand = it.brand || 'Fructi';
    const size = it.size ? ` ${it.size}` : '';
    const glass = it.container === 'Vidrio' ? ' Vidrio' : '';
    const flavor =
      it.flavorType === 'surtido'
        ? ' Surtido'
        : it.selectedFlavor
        ? ` ${it.selectedFlavor}`
        : '';
    return `${brand}${size}${glass}${flavor}`.trim();
  };

  const modalContent = (
    <div className="thermal-modal-backdrop fixed inset-0 z-[10000] min-h-screen bg-[#f8fafc] overflow-y-auto flex flex-col items-center py-2 sm:py-6 px-2.5 sm:px-4 print:static print:h-auto print:min-h-0 print:w-full print:block print:p-0 print:m-0 print:bg-white print:overflow-visible animate-in fade-in duration-150">
      {/* Estilos ultra-optimizados para RawBT, AirPrint y cabezales térmicos 58mm / 80mm */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 0mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          html, body {
            width: 100% !important;
            max-width: 58mm !important;
            min-width: 0 !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * {
            visibility: hidden !important;
          }
          .thermal-modal-backdrop {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 auto !important;
            background: transparent !important;
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
            position: static !important;
            display: block !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            max-width: 48mm !important;
            min-width: 0 !important;
            padding: 1mm 1mm 12mm 1mm !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 9.5px !important;
            line-height: 1.25 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            height: auto !important;
            page-break-after: avoid;
            page-break-inside: auto !important;
          }
          /* Control estricto de pesos tipográficos para evitar empaste en papel térmico (203 DPI) */
          #thermal-printable-receipt,
          #thermal-printable-receipt p,
          #thermal-printable-receipt span,
          #thermal-printable-receipt div {
            font-weight: 400 !important;
          }
          #thermal-printable-receipt .font-medium {
            font-weight: 500 !important;
          }
          #thermal-printable-receipt .font-semibold {
            font-weight: 600 !important;
          }
          #thermal-printable-receipt .font-bold {
            font-weight: 600 !important;
          }
          #thermal-printable-receipt .font-extrabold {
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

      {/* Barra superior estilo Apple con frosted glass (oculta al imprimir) */}
      <div className="print:hidden w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 mb-3 sm:mb-4 flex items-center justify-between gap-2 shrink-0 sticky top-2 z-20">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Volver</span>
        </button>

        <div className="text-center min-w-0 px-1">
          <h2 className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight truncate">
            Comprobante de Entrega
          </h2>
          <p className="text-[10px] text-slate-500 font-mono truncate">
            {order.orderNumber}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] active:scale-95 text-white rounded-xl sm:rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir</span>
        </button>
      </div>

      {/* Contenedor del Comprobante */}
      <div
        id="thermal-printable-receipt"
        ref={receiptRef}
        className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-200/80 p-4 sm:p-7 mb-16 text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-[48mm] print:w-[48mm] print:rounded-none"
      >
        {/* SECCIÓN 1: CABECERA Y EMISOR */}
        <div className="text-center pt-0.5 pb-1">
          <AnethReceiptLogo className="w-28 sm:w-32 h-auto mx-auto mb-1.5" />
          <h1 className="font-bold text-[11.5px] sm:text-[12.5px] uppercase tracking-tight text-slate-900 print:text-black leading-tight">
            ANETH Distribuciones
          </h1>
          <p className="text-[9px] sm:text-[9.5px] text-slate-600 print:text-black leading-tight mt-0.5 font-normal">
            {DEFAULT_TAX_PROFILE.razonSocial}
          </p>
          <p className="font-medium text-[9px] sm:text-[9.5px] pt-0.5 text-slate-800 print:text-black">
            RUC: {DEFAULT_TAX_PROFILE.ruc}
          </p>
          <p className="text-[8.5px] sm:text-[9px] text-slate-500 print:text-black font-normal">
            Ambato - Ecuador
          </p>
          <div className="border-b border-black my-2" />
        </div>

        {/* SECCIÓN 2: DATOS DEL COMPROBANTE */}
        <div className="space-y-0.5 text-[9.5px] sm:text-[10px]">
          <div className="flex justify-between items-baseline">
            <span className="text-slate-600 print:text-black font-medium">PEDIDO:</span>
            <span className="font-semibold font-mono text-slate-900 print:text-black">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-600 print:text-black font-medium">FECHA:</span>
            <span className="text-slate-900 print:text-black">{formattedDate}</span>
          </div>
          {invoice?.invoiceNumber && (
            <div className="flex justify-between items-baseline">
              <span className="text-slate-600 print:text-black font-medium">FACTURA SRI:</span>
              <span className="font-semibold font-mono text-slate-900 print:text-black">{invoice.invoiceNumber}</span>
            </div>
          )}
        </div>

        {/* SECCIÓN 3: DATOS DEL CLIENTE */}
        <div className="border-t border-dashed border-black pt-1.5 mt-1.5 space-y-0.5 text-[9.5px] sm:text-[10px]">
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-slate-600 print:text-black font-medium shrink-0">CLIENTE:</span>
            <span className="font-semibold uppercase text-right break-words pl-1 text-slate-900 print:text-black">{clientName}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-600 print:text-black font-medium">C.I. / RUC:</span>
            <span className="font-mono text-slate-900 print:text-black font-medium">{clientTaxId}</span>
          </div>
          {clientPhone && (
            <div className="flex justify-between items-baseline">
              <span className="text-slate-600 print:text-black font-medium">TELÉFONO:</span>
              <span className="text-slate-900 print:text-black font-medium">{clientPhone}</span>
            </div>
          )}
          {clientAddress && (
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-slate-600 print:text-black font-medium shrink-0">DIRECCIÓN:</span>
              <span className="text-right break-words pl-1 text-slate-800 print:text-black font-normal">{clientAddress}</span>
            </div>
          )}
        </div>

        {/* SECCIÓN 4: TABLA DE PRODUCTOS (SIN TRUNCATE, FLUJO NATURAL) */}
        <div className="border-t border-black pt-1.5 mt-2 mb-1.5">
          <div className="flex justify-between font-semibold text-[9.5px] sm:text-[10px] border-b border-black pb-1 mb-1 tracking-tight text-slate-800 print:text-black">
            <span className="w-12 text-left shrink-0">CANT</span>
            <span className="flex-1 text-left px-1.5">DESCRIPCIÓN</span>
            <span className="w-12 text-right shrink-0">TOTAL</span>
          </div>

          {/* LISTA DE ITEMS */}
          <div className="space-y-1 text-[9.5px] sm:text-[10px]">
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

              const packType = it.container === 'Vidrio' ? 'JAV' : 'PAQ';
              const itemName = formatReceiptItemName(it);

              return (
                <React.Fragment key={idx}>
                  {/* Fila de Paquetes / Javas */}
                  {hasJavas && (
                    <div className="flex justify-between items-start py-0.5 border-b border-dashed border-slate-200">
                      <span className="w-12 font-medium shrink-0 pt-0.5 text-slate-900 print:text-black">
                        {it.quantityJavas} {packType}
                      </span>
                      <span className="flex-1 text-left px-1.5 font-normal text-slate-900 print:text-black break-words leading-tight">
                        {itemName}
                      </span>
                      <span className="w-12 text-right font-semibold font-mono shrink-0 pt-0.5 text-slate-900 print:text-black">
                        ${packSubtotal.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Fila de Unidades Sueltas */}
                  {hasUnits && (
                    <div className="flex justify-between items-start py-0.5 border-b border-dashed border-slate-200">
                      <span className="w-12 font-medium shrink-0 pt-0.5 text-slate-900 print:text-black">
                        {it.quantityUnits} UND
                      </span>
                      <span className="flex-1 text-left px-1.5 font-normal text-slate-900 print:text-black break-words leading-tight">
                        {itemName}
                      </span>
                      <span className="w-12 text-right font-semibold font-mono shrink-0 pt-0.5 text-slate-900 print:text-black">
                        ${unitSubtotal.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Fallback para pedidos históricos */}
                  {!hasJavas && !hasUnits && (
                    <div className="flex justify-between items-start py-0.5 border-b border-dashed border-slate-200">
                      <span className="w-12 font-medium shrink-0 pt-0.5 text-slate-900 print:text-black">
                        {it.totalBottles || 1} UND
                      </span>
                      <span className="flex-1 text-left px-1.5 font-normal text-slate-900 print:text-black break-words leading-tight">
                        {itemName}
                      </span>
                      <span className="w-12 text-right font-semibold font-mono shrink-0 pt-0.5 text-slate-900 print:text-black">
                        ${it.subtotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN 5: TOTALES Y FORMA DE PAGO */}
        <div className="border-t border-dashed border-black pt-1.5 my-1.5 space-y-1 text-[9.5px] sm:text-[10px]">
          <div className="flex justify-between items-baseline">
            <span className="text-slate-600 print:text-black font-medium">SUBTOTAL (15%):</span>
            <span className="font-mono font-medium">${subtotal15.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-600 print:text-black font-medium">IVA 15%:</span>
            <span className="font-mono font-medium">${tax15.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-baseline font-bold text-[12px] sm:text-[13px] border-y border-black py-1 my-1 text-black">
            <span>TOTAL A PAGAR:</span>
            <span className="font-mono font-bold">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-medium text-slate-600 print:text-black">FORMA DE PAGO:</span>
            <span className="font-semibold text-slate-900 print:text-black">{paymentMethodLabel}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-600 print:text-black font-medium">COBRADO HOY:</span>
            <span className="font-mono font-medium">${order.amountPaid.toFixed(2)}</span>
          </div>

          {hasDebt ? (
            <div className="border border-black p-2.5 my-2 text-left bg-slate-50 print:bg-transparent">
              <div className="flex justify-between font-bold text-[11px] text-black">
                <span>SALDO PENDIENTE:</span>
                <span className="font-mono font-bold">${order.debtBalance.toFixed(2)}</span>
              </div>
              {(order.promisedCollectionDate || order.promisedCollectionTime) && (
                <p className="text-[9px] mt-0.5 text-slate-700 print:text-black">
                  <span className="font-semibold">Compromiso:</span>{' '}
                  {formatPromisedDate(order.promisedCollectionDate)}{' '}
                  {order.promisedCollectionTime ? `(${order.promisedCollectionTime})` : ''}
                </p>
              )}
              {/* Espacio amplio y limpio para firma física con esfero */}
              <div className="mt-2 pt-1 border-t border-dashed border-black text-center">
                <div className="h-16 sm:h-20 flex items-end justify-center pb-1">
                  <div className="border-b border-black w-48 mx-auto" />
                </div>
                <p className="text-[9px] sm:text-[9.5px] uppercase font-semibold text-black tracking-tight mt-1">
                  Firma Cliente: {clientName}
                </p>
                <p className="text-[8px] sm:text-[8.5px] text-slate-600 print:text-black font-mono">
                  C.I./RUC: {clientTaxId}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-between font-bold text-[10.5px] pt-0.5">
              <span className="text-slate-700 print:text-black font-medium">ESTADO:</span>
              <span className="text-emerald-700 font-bold print:text-black">CANCELADO</span>
            </div>
          )}
        </div>

        {/* SECCIÓN 6: CÓDIGO QR POPL MÁS GRANDE Y CON ESPACIO DESPEJADO */}
        <div className="mt-3 pt-3 border-t border-dashed border-black text-center space-y-1.5">
          <div className="flex justify-center py-2.5">
            <PoplQRCodeSVG
              value={digitalInvoiceUrl}
              size={110}
              color="#000000"
              bgColor="#ffffff"
            />
          </div>
          <p className="font-semibold text-[9.5px] sm:text-[10px] uppercase tracking-tight text-black leading-tight">
            Factura Electrónica SRI
          </p>
          <p className="text-[8px] sm:text-[8.5px] text-slate-600 print:text-black leading-tight">
            Escanee para ver o descargar comprobante
          </p>
        </div>

        {/* SECCIÓN 7: PIE DE TICKET */}
        <div className="mt-2.5 pt-2 border-t border-black text-center text-[9px] sm:text-[9.5px]">
          <p className="font-semibold uppercase tracking-tight text-slate-900 print:text-black">
            ¡Gracias por su preferencia!
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
