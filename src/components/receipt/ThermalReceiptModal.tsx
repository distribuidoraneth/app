'use client';

import React, { useMemo, useRef } from 'react';
import { Order, Client, Invoice } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
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
  const paymentMethodLabel =
    order.paymentMethod === 'cash'
      ? 'EFECTIVO'
      : order.paymentMethod === 'deuna'
      ? 'DEUNA'
      : order.paymentMethod === 'transfer'
      ? 'TRANSFERENCIA'
      : 'CRÉDITO';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Estilos optimizados para 58mm (2.283 in) en impresoras térmicas tipo Munbyn IMP001 */}
      <style>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0mm;
          }
          html, body {
            width: 58mm !important;
            max-width: 58mm !important;
            min-width: 58mm !important;
            margin: 0 !important;
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
          }
          #thermal-printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            max-width: 58mm !important;
            min-width: 58mm !important;
            padding: 1.5mm 2mm 8mm 2mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11px !important;
            line-height: 1.22 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .no-thermal-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-[340px] bg-slate-100 rounded-2xl shadow-2xl overflow-hidden border border-slate-300 my-auto flex flex-col max-h-[92vh] print:border-none print:shadow-none print:m-0 print:w-[58mm] print:max-w-[58mm] print:max-h-none print:rounded-none print:bg-white print:overflow-visible">
        {/* Barra superior de control */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between no-thermal-print shrink-0 shadow-xs">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Recibo Térmico (58mm)
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Munbyn IMP001
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
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
            className="w-[280px] print:w-[58mm] bg-white text-black p-3.5 pb-6 shadow-md border border-slate-200 rounded-xs font-mono text-[11px] leading-[1.22] tracking-tight select-all print:shadow-none print:border-none print:p-0 print:pb-0"
          >
            {/* LOGOTIPO OFICIAL DISTRIBUIDORA ANETH */}
            <div className="text-center pt-1 pb-1">
              <AnethReceiptLogo className="w-36 h-auto mx-auto mb-1" />
              <p className="font-bold text-[10px] uppercase tracking-tight text-slate-800">
                {DEFAULT_TAX_PROFILE.razonSocial}
              </p>
              <p className="font-bold text-[11px]">
                RUC: {DEFAULT_TAX_PROFILE.ruc}
              </p>
              <p className="font-extrabold text-[13px] tracking-tighter leading-none pt-1">
                ================================
              </p>
            </div>

            {/* COMPROBANTE Y FECHA */}
            <div className="space-y-0.5 text-[10.5px] pt-1">
              <div className="flex justify-between font-bold">
                <span>COMPROBANTE:</span>
                <span className="font-black">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>FECHA:</span>
                <span>{formattedDate}</span>
              </div>
              {invoice?.invoiceNumber && (
                <div className="flex justify-between font-bold">
                  <span>FACTURA SRI:</span>
                  <span>{invoice.invoiceNumber}</span>
                </div>
              )}
            </div>

            {/* CÓDIGO DE BARRAS Y CLAVE DE ACCESO */}
            <div className="pt-2 pb-1 border-t border-dashed border-black mt-1 text-center space-y-1">
              <BarcodeSVG value={claveAcceso} height={34} showText={false} />
              <div>
                <p className="text-[8.5px] font-bold uppercase leading-none">CLAVE DE ACCESO SRI:</p>
                <p className="text-[8px] font-mono tracking-tighter break-all select-all leading-tight pt-0.5">
                  {claveAcceso}
                </p>
              </div>
            </div>

            {/* LÍNEA DIVISORIA */}
            <p className="text-center font-bold tracking-tighter my-0.5">
              --------------------------------
            </p>

            {/* DATOS DEL CLIENTE */}
            <div className="space-y-0.5 text-[10px]">
              <p className="font-black uppercase">CLIENTE: {clientName}</p>
              <p><span className="font-bold">C.I./RUC:</span> {clientTaxId}</p>
              {clientPhone && <p><span className="font-bold">TELÉFONO:</span> {clientPhone}</p>}
              {clientAddress && (
                <p className="leading-tight"><span className="font-bold">DIR:</span> {clientAddress}</p>
              )}
            </div>

            {/* LÍNEA DIVISORIA */}
            <p className="text-center font-bold tracking-tighter my-0.5">
              --------------------------------
            </p>

            {/* TABLA DE PRODUCTOS */}
            <div className="flex justify-between font-black text-[10px] border-b border-black pb-0.5 mb-1">
              <span className="w-10">CANT</span>
              <span className="flex-1 text-left px-1">DETALLE</span>
              <span className="w-10 text-right">P.U</span>
              <span className="w-11 text-right">TOTAL</span>
            </div>

            {/* LISTA DE ITEMS */}
            <div className="space-y-1 text-[10px]">
              {order.items.map((it, idx) => {
                const qtyLabel =
                  it.quantityJavas > 0 && it.quantityUnits > 0
                    ? `${it.quantityJavas}J+${it.quantityUnits}U`
                    : it.quantityJavas > 0
                    ? `${it.quantityJavas} JAV`
                    : `${it.quantityUnits} UNI`;

                const flavorDesc =
                  it.flavorType === 'single'
                    ? it.selectedFlavor
                    : it.surtidoDetails
                    ? Object.entries(it.surtidoDetails)
                        .map(([f, q]) => `${q} ${f}`)
                        .join(',')
                    : 'Surtido';

                const unitPrice = it.quantityJavas > 0 ? it.pricePerJava : it.pricePerUnit;

                return (
                  <div key={idx} className="pb-0.5 border-b border-dashed border-slate-200">
                    <div className="flex justify-between items-start">
                      <span className="w-10 font-bold">{qtyLabel}</span>
                      <span className="flex-1 text-left px-1 font-bold leading-tight">
                        {it.beverageType} {it.container} {it.size}
                      </span>
                      <span className="w-10 text-right font-mono">
                        ${unitPrice.toFixed(2)}
                      </span>
                      <span className="w-11 text-right font-black font-mono">
                        ${it.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="pl-10 text-[9px] text-slate-700 leading-none">
                      {flavorDesc} ({it.totalBottles} bots)
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LÍNEA DIVISORIA */}
            <p className="text-center font-bold tracking-tighter my-0.5">
              --------------------------------
            </p>

            {/* TOTALES */}
            <div className="space-y-0.5 text-[10.5px]">
              <div className="flex justify-between font-black text-[13px] border-b border-black pb-0.5 mb-1">
                <span>TOTAL A PAGAR:</span>
                <span className="font-mono font-black">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">FORMA DE PAGO:</span>
                <span className="font-black">{paymentMethodLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>COBRADO HOY:</span>
                <span className="font-mono font-bold">${order.amountPaid.toFixed(2)}</span>
              </div>

              {hasDebt ? (
                <div className="flex justify-between font-black text-[12px] bg-black text-white px-1 py-0.5 my-1">
                  <span>SALDO EN DEUDA:</span>
                  <span className="font-mono">${order.debtBalance.toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between font-bold text-[10.5px] pt-0.5">
                  <span>ESTADO:</span>
                  <span>TOTALMENTE CANCELADO</span>
                </div>
              )}
            </div>

            {/* COMPROMISO DIRECTO DE PAGO Y FIRMA (CUANDO HAY SALDO PENDIENTE) */}
            {hasDebt && (
              <div className="mt-2 pt-1 border-t border-black space-y-1">
                <p className="font-black text-center text-[10.5px] uppercase">
                  COMPROMISO DE PAGO (CRÉDITO)
                </p>
                <div className="text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-bold">Saldo por cobrar:</span>
                    <span className="font-black">${order.debtBalance.toFixed(2)}</span>
                  </div>
                  {(order.promisedCollectionDate || order.promisedCollectionTime) && (
                    <div className="flex justify-between">
                      <span className="font-bold">Fecha de cobro:</span>
                      <span className="font-bold">
                        {order.promisedCollectionDate} {order.promisedCollectionTime ? `(${order.promisedCollectionTime})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* ESPACIO PARA FIRMA DE CONFORMIDAD */}
                <div className="pt-7 text-center space-y-0.5">
                  <div className="border-b border-black w-44 mx-auto" />
                  <p className="font-black text-[9.5px] uppercase">
                    FIRMA DEL CLIENTE
                  </p>
                  <p className="text-[9px] truncate">
                    Nombre: {clientName}
                  </p>
                  <p className="text-[9px]">
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
                  size={120}
                  color="#000000"
                  bgColor="#ffffff"
                />
              </div>
              <p className="font-black text-[9.5px] uppercase leading-tight">
                Factura Digital SRI
              </p>
              <p className="text-[8px] text-slate-700 leading-tight">
                Escanee el código QR para ver y descargar su comprobante
              </p>
              <p className="text-[7.5px] font-mono break-all text-slate-600">
                {digitalInvoiceUrl}
              </p>
            </div>

            {/* PIE DE TICKET */}
            <div className="mt-2 pt-1 border-t border-black text-center space-y-0.5 text-[9.5px]">
              <p className="font-black uppercase">¡GRACIAS POR SU PREFERENCIA!</p>
              <p className="font-extrabold text-[12px] tracking-tighter leading-none pt-0.5">
                ================================
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
