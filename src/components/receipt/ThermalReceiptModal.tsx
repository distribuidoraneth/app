'use client';

import React, { useMemo, useRef } from 'react';
import { Order, Client, Invoice } from '@/types';
import { formatCurrency, formatItemTitle } from '@/lib/utils/formatters';
import { DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { PoplQRCodeSVG } from '@/components/ui/PoplQRCodeSVG';
import { BarcodeSVG } from '@/components/ui/BarcodeSVG';
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

  const claveAcceso = useMemo(() => {
    if (!order) return '';
    if (invoice?.claveAcceso) return invoice.claveAcceso;
    const seq = parseInt(
      (invoice?.invoiceNumber || order.orderNumber).replace(/\D/g, '').slice(-9) || '1',
      10
    );
    return generarClaveAcceso({
      fecha: new Date(order.createdAt),
      ruc: DEFAULT_TAX_PROFILE.ruc,
      ambiente: '1',
      establecimiento: '001',
      puntoEmision: '001',
      secuencial: seq,
    });
  }, [invoice, order]);

  if (!isOpen || !order) return null;

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

  const digitalInvoiceUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/factura/${invoice?.id || order.invoiceId || order.orderNumber}`
    : `https://distribuidora-aneth.vercel.app/factura/${invoice?.id || order.invoiceId || order.orderNumber}`;

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

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
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
            font-size: 10px !important;
            line-height: 1.25 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          /* Control estricto de pesos tipográficos para RawBT (evita saturación y sangrado térmico) */
          #thermal-printable-receipt,
          #thermal-printable-receipt p,
          #thermal-printable-receipt span,
          #thermal-printable-receipt div {
            font-weight: 400 !important;
          }
          #thermal-printable-receipt .font-semibold,
          #thermal-printable-receipt .font-bold {
            font-weight: 600 !important;
          }
          #thermal-printable-receipt .font-extrabold,
          #thermal-printable-receipt .font-black {
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

      <div className="relative w-full max-w-[340px] bg-slate-100 rounded-2xl shadow-2xl overflow-hidden border border-slate-300 my-auto flex flex-col max-h-[92vh] print:border-none print:shadow-none print:m-0 print:w-[48mm] print:max-w-[48mm] print:max-h-none print:rounded-none print:bg-white print:overflow-visible">
        {/* Barra superior de control */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between no-thermal-print shrink-0 shadow-xs">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Recibo Térmico (58mm)
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Munbyn • RawBT Optimizado
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-97 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-transform duration-150 ease-out cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenedor del ticket con scroll suave */}
        <div className="p-3 sm:p-4 overflow-y-auto flex justify-center flex-1 print:p-0 print:overflow-visible">
          {/* TICKET IMPRIMIBLE 58MM */}
          <div
            id="thermal-printable-receipt"
            ref={receiptRef}
            className="w-[280px] print:w-[48mm] bg-white text-black p-3.5 pb-6 shadow-md border border-slate-200 rounded-xs font-sans text-[11px] leading-[1.25] tracking-normal select-all print:shadow-none print:border-none print:p-0 print:pb-0"
          >
            {/* LOGOTIPO OFICIAL DISTRIBUIDORA ANETH */}
            <div className="text-center pt-1 pb-1">
              <AnethReceiptLogo className="w-36 h-auto mx-auto mb-1" />
              <p className="font-bold text-[10px] uppercase tracking-tight text-slate-800">
                {DEFAULT_TAX_PROFILE.razonSocial}
              </p>
              <p className="font-semibold text-[10.5px]">
                RUC: {DEFAULT_TAX_PROFILE.ruc}
              </p>
              <div className="border-b-2 border-black my-1.5" />
            </div>

            {/* COMPROBANTE Y FECHA */}
            <div className="space-y-0.5 text-[10px] pt-0.5">
              <div className="flex justify-between font-semibold">
                <span>COMPROBANTE:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between font-semibold">
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

            {/* CÓDIGO DE BARRAS Y CLAVE DE ACCESO */}
            <div className="pt-2 pb-1 border-t border-dashed border-black mt-1 text-center space-y-1">
              <BarcodeSVG value={claveAcceso} height={32} showText={false} />
              <div>
                <p className="text-[8.5px] font-bold uppercase leading-none">CLAVE DE ACCESO SRI:</p>
                <p className="text-[8px] font-mono tracking-tight break-all select-all leading-tight pt-0.5">
                  {claveAcceso}
                </p>
              </div>
            </div>

            {/* LÍNEA DIVISORIA */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* DATOS DEL CLIENTE */}
            <div className="space-y-0.5 text-[10px]">
              <p className="font-bold uppercase">CLIENTE: {clientName}</p>
              <p><span className="font-semibold">C.I./RUC:</span> {clientTaxId}</p>
              {clientPhone && <p><span className="font-semibold">TELÉFONO:</span> {clientPhone}</p>}
              {clientAddress && (
                <p className="leading-tight"><span className="font-semibold">DIR:</span> {clientAddress}</p>
              )}
            </div>

            {/* LÍNEA DIVISORIA */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* TABLA DE PRODUCTOS */}
            <div className="flex justify-between font-bold text-[10px] border-b border-black pb-0.5 mb-1">
              <span className="w-10">CANT</span>
              <span className="flex-1 text-left px-1">DETALLE</span>
              <span className="w-10 text-right">P.U</span>
              <span className="w-11 text-right">TOTAL</span>
            </div>

            {/* LISTA DE ITEMS DESGLOSADOS */}
            <div className="space-y-1 text-[10px]">
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
                      <div className="pb-0.5 border-b border-dashed border-slate-300">
                        <div className="flex justify-between items-start">
                          <span className="w-10 font-semibold">{it.quantityJavas} {packType}</span>
                          <span className="flex-1 text-left px-1 font-semibold leading-tight">
                            {it.brand || 'Fructi'} {it.container === 'Vidrio' ? 'Java' : 'Pack'} {it.size}
                          </span>
                          <span className="w-10 text-right font-mono text-[9.5px]">
                            ${it.pricePerJava.toFixed(2)}
                          </span>
                          <span className="w-11 text-right font-bold font-mono text-[9.5px]">
                            ${packSubtotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="pl-10 text-[9px] text-slate-700 leading-none">
                          {it.flavorType === 'surtido' ? `Surt: ${flavorDesc}` : it.selectedFlavor} ({it.quantityJavas * it.unitsPerJava} unds)
                        </div>
                      </div>
                    )}

                    {/* Línea de Unidad Suelta */}
                    {hasUnits && (
                      <div className="pb-0.5 border-b border-dashed border-slate-300">
                        <div className="flex justify-between items-start">
                          <span className="w-10 font-semibold">{it.quantityUnits} UNI</span>
                          <span className="flex-1 text-left px-1 font-semibold leading-tight">
                            {it.brand || 'Fructi'} {it.size} {it.container} (Suelta)
                          </span>
                          <span className="w-10 text-right font-mono text-[9.5px]">
                            ${effectivePricePerUnit.toFixed(2)}
                          </span>
                          <span className="w-11 text-right font-bold font-mono text-[9.5px]">
                            ${unitSubtotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="pl-10 text-[9px] text-slate-700 leading-none">
                          {it.flavorType === 'single' ? it.selectedFlavor : 'Surtido'} (Unidad individual)
                        </div>
                      </div>
                    )}

                    {/* Fallback para pedidos históricos */}
                    {!hasJavas && !hasUnits && (
                      <div className="pb-0.5 border-b border-dashed border-slate-300">
                        <div className="flex justify-between items-start">
                          <span className="w-10 font-semibold">{it.totalBottles || 1} UNI</span>
                          <span className="flex-1 text-left px-1 font-semibold leading-tight">
                            {formatItemTitle(it)}
                          </span>
                          <span className="w-10 text-right font-mono text-[9.5px]">
                            ${it.pricePerJava.toFixed(2)}
                          </span>
                          <span className="w-11 text-right font-bold font-mono text-[9.5px]">
                            ${it.subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* LÍNEA DIVISORIA */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* TOTALES */}
            <div className="space-y-0.5 text-[10.5px]">
              <div className="flex justify-between text-[10px]">
                <span>SUBTOTAL (BASE 15%):</span>
                <span className="font-mono font-semibold">${subtotal15.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>IVA 15%:</span>
                <span className="font-mono font-semibold">${tax15.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-[12px] border-b border-black pb-0.5 mb-1 pt-0.5">
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
                <div className="flex justify-between font-bold text-[11.5px] border-2 border-black px-1.5 py-1 my-1">
                  <span>SALDO EN DEUDA:</span>
                  <span className="font-mono font-bold">${order.debtBalance.toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between font-semibold text-[10px] pt-0.5">
                  <span>ESTADO:</span>
                  <span>TOTALMENTE CANCELADO</span>
                </div>
              )}
            </div>

            {/* COMPROMISO DIRECTO DE PAGO Y FIRMA (CUANDO HAY SALDO PENDIENTE) */}
            {hasDebt && (
              <div className="mt-2 pt-1 border-t border-black space-y-1">
                <p className="font-bold text-center text-[10px] uppercase">
                  COMPROMISO DE PAGO (CRÉDITO)
                </p>
                <div className="text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-semibold">Saldo por cobrar:</span>
                    <span className="font-bold">${order.debtBalance.toFixed(2)}</span>
                  </div>
                  {(order.promisedCollectionDate || order.promisedCollectionTime) && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Fecha de cobro:</span>
                      <span className="font-semibold">
                        {formatPromisedDate(order.promisedCollectionDate)} {order.promisedCollectionTime ? `(${order.promisedCollectionTime})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* ESPACIO PARA FIRMA DE CONFORMIDAD */}
                <div className="pt-6 text-center space-y-0.5">
                  <div className="border-b border-black w-44 mx-auto" />
                  <p className="font-bold text-[9px] uppercase">
                    FIRMA DEL CLIENTE
                  </p>
                  <p className="text-[8.5px] truncate">
                    Nombre: {clientName}
                  </p>
                  <p className="text-[8.5px]">
                    C.I./RUC: {clientTaxId}
                  </p>
                </div>
              </div>
            )}

            {/* CÓDIGO QR ESTILO POPL (PUNTOS CIRCULARES Y ESQUINAS REDONDEADAS) */}
            <div className="mt-2 pt-2 border-t border-dashed border-black text-center space-y-1">
              <div className="flex justify-center py-1">
                <PoplQRCodeSVG
                  value={digitalInvoiceUrl}
                  size={110}
                  color="#000000"
                  bgColor="#ffffff"
                />
              </div>
              <p className="font-bold text-[9px] uppercase leading-tight">
                Factura Digital SRI
              </p>
              <p className="text-[8px] text-slate-700 leading-tight">
                Escanee el código QR para ver y descargar su comprobante
              </p>
              <p className="text-[7px] font-mono break-all text-slate-600">
                {digitalInvoiceUrl}
              </p>
            </div>

            {/* PIE DE TICKET */}
            <div className="mt-2 pt-1 border-t border-black text-center space-y-0.5 text-[9px]">
              <p className="font-bold uppercase">¡GRACIAS POR SU PREFERENCIA!</p>
              <div className="border-b-2 border-black my-1.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
