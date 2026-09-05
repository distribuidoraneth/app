'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Order, Client, Invoice } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
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
      ? 'DEUNA (BANCO PICHINCHA)'
      : order.paymentMethod === 'transfer'
      ? 'TRANSFERENCIA BANCARIA'
      : 'VENTA A CRÉDITO';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Stylesheet scoped for 58mm (2.283 in) POS thermal printers like Munbyn IMP001 */}
      <style jsx global>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0mm;
          }
          html, body {
            width: 58mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * {
            visibility: hidden;
          }
          #thermal-printable-receipt,
          #thermal-printable-receipt * {
            visibility: visible;
          }
          #thermal-printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            max-width: 58mm !important;
            min-width: 58mm !important;
            padding: 2mm 2.5mm 8mm 2.5mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11px !important;
            line-height: 1.25 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .no-thermal-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto print:border-none print:shadow-none print:m-0 print:w-[58mm] print:max-w-[58mm] print:rounded-none">
        {/* Top interactive action bar (hidden during print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-thermal-print">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Recibo Térmico 58mm</h3>
              <p className="text-[11px] text-slate-300 font-medium">Munbyn IMP001 • 203 DPI</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper roll preview background container */}
        <div className="p-4 sm:p-6 bg-slate-200/70 overflow-y-auto max-h-[82vh] flex justify-center print:p-0 print:bg-white print:max-h-none print:overflow-visible">
          {/* THE THERMAL RECEIPT SLIP (Exact 58mm aspect & typography) */}
          <div
            id="thermal-printable-receipt"
            ref={receiptRef}
            className="w-[280px] sm:w-[310px] print:w-[58mm] bg-white text-black p-3.5 sm:p-4 shadow-lg border border-slate-300 rounded-sm font-mono text-[11px] leading-[1.28] tracking-tight select-all print:shadow-none print:border-none print:p-1"
          >
            {/* SERRATED EDGE / TICKET HEADER */}
            <div className="text-center space-y-1 pb-1">
              <p className="font-extrabold text-[15px] tracking-tighter leading-none">
                ================================
              </p>
              <h1 className="font-black text-[16px] tracking-normal uppercase">
                DISTRIBUIDORA ANETH
              </h1>
              <p className="text-[10px] font-bold tracking-wide uppercase">
                Bebidas • Aguas • Colas • Tés
              </p>
              <p className="font-extrabold text-[15px] tracking-tighter leading-none">
                ================================
              </p>
            </div>

            {/* EMISOR FISCAL DETAILS */}
            <div className="text-[10px] space-y-0.5 pt-0.5">
              <p className="font-black uppercase">{DEFAULT_TAX_PROFILE.razonSocial}</p>
              <p><span className="font-black">RUC:</span> {DEFAULT_TAX_PROFILE.ruc}</p>
              <p><span className="font-black">MATRIZ:</span> {DEFAULT_TAX_PROFILE.dirMatriz}</p>
              <p><span className="font-black">TELÉFONO:</span> 096 390 6286</p>
              <p className="font-bold text-[9.5px] uppercase pt-0.5">
                CONTRIBUYENTE RÉGIMEN RIMPE
              </p>
              <p className="font-bold text-[9.5px] uppercase">
                NEGOCIO POPULAR
              </p>
              <p><span className="font-black">OBLIGADO CONTABILIDAD:</span> NO</p>
            </div>

            {/* DIVIDER */}
            <p className="text-center font-bold tracking-tighter my-1">
              --------------------------------
            </p>

            {/* COMPROBANTE & FECHA */}
            <div className="space-y-0.5 text-[10.5px]">
              <div className="flex justify-between font-black">
                <span>COMPROBANTE:</span>
                <span>{order.orderNumber}</span>
              </div>
              {invoice?.invoiceNumber && (
                <div className="flex justify-between font-bold">
                  <span>FACTURA SRI:</span>
                  <span>{invoice.invoiceNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-bold">FECHA:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">MODALIDAD:</span>
                <span className="font-black uppercase">
                  {order.saleType === 'autoventa' ? 'Autoventa en Ruta' : 'Preventa Programada'}
                </span>
              </div>
            </div>

            {/* DIVIDER */}
            <p className="text-center font-bold tracking-tighter my-1">
              --------------------------------
            </p>

            {/* CLIENT INFO */}
            <div className="space-y-0.5 text-[10.5px]">
              <p className="font-black uppercase">CLIENTE: {clientName}</p>
              <p><span className="font-bold">C.I. / RUC:</span> {clientTaxId}</p>
              {clientPhone && <p><span className="font-bold">CELULAR:</span> {clientPhone}</p>}
              {clientAddress && (
                <p className="leading-tight"><span className="font-bold">DIREC:</span> {clientAddress}</p>
              )}
            </div>

            {/* DIVIDER */}
            <p className="text-center font-bold tracking-tighter my-1">
              --------------------------------
            </p>

            {/* TABLE HEADER */}
            <div className="flex justify-between font-black text-[10.5px] border-b border-black pb-0.5 mb-1">
              <span className="w-10">CANT</span>
              <span className="flex-1 text-left px-1">DETALLE</span>
              <span className="w-10 text-right">P.U</span>
              <span className="w-12 text-right">TOTAL</span>
            </div>

            {/* ITEMS LIST */}
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
                  <div key={idx} className="pb-0.5 border-b border-dashed border-slate-300">
                    <div className="flex justify-between items-start">
                      <span className="w-10 font-bold">{qtyLabel}</span>
                      <span className="flex-1 text-left px-1 font-bold leading-tight">
                        {it.beverageType} {it.container} {it.size}
                      </span>
                      <span className="w-10 text-right font-mono">
                        ${unitPrice.toFixed(2)}
                      </span>
                      <span className="w-12 text-right font-black font-mono">
                        ${it.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="pl-10 text-[9px] text-slate-800 leading-none">
                      {flavorDesc} ({it.totalBottles} bots)
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DIVIDER */}
            <p className="text-center font-bold tracking-tighter my-1">
              --------------------------------
            </p>

            {/* FINANCIAL TOTALS */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span className="font-mono">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>IVA 0% (RIMPE):</span>
                <span className="font-mono">$0.00</span>
              </div>
              <div className="flex justify-between font-black text-[13px] border-t border-black pt-1">
                <span>TOTAL A PAGAR:</span>
                <span className="font-mono font-black">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>

            {/* PAYMENT BREAKDOWN */}
            <p className="text-center font-bold tracking-tighter my-1">
              --------------------------------
            </p>
            <div className="space-y-0.5 text-[10.5px]">
              <div className="flex justify-between">
                <span className="font-bold">FORMA DE PAGO:</span>
                <span className="font-black">{paymentMethodLabel}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>MONTO COBRADO HOY:</span>
                <span className="font-mono font-black">${order.amountPaid.toFixed(2)}</span>
              </div>

              {hasDebt ? (
                <>
                  <div className="flex justify-between font-black text-[12px] bg-black text-white px-1 py-0.5 my-1">
                    <span>SALDO PENDIENTE:</span>
                    <span className="font-mono">${order.debtBalance.toFixed(2)}</span>
                  </div>
                  <div className="pt-0.5 text-[10px] space-y-0.5">
                    <p className="font-black text-center uppercase tracking-wide">
                      * VENTA REGISTRADA A CRÉDITO *
                    </p>
                    {order.promisedCollectionDate && (
                      <div className="flex justify-between">
                        <span className="font-bold">FECHA PACTADA COBRO:</span>
                        <span className="font-black">{order.promisedCollectionDate}</span>
                      </div>
                    )}
                    {order.promisedCollectionTime && (
                      <div className="flex justify-between">
                        <span className="font-bold">HORARIO DE COBRO:</span>
                        <span className="font-bold">{order.promisedCollectionTime}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex justify-between font-black text-[11px] pt-1">
                  <span>ESTADO:</span>
                  <span className="uppercase">TOTALMENTE CANCELADO</span>
                </div>
              )}
            </div>

            {/* COMPROMISO Y RESPONSABILIDAD DE PAGO (FIRMA DEL CLIENTE) */}
            {hasDebt && (
              <div className="mt-2 pt-1 border-t-2 border-black space-y-2">
                <p className="font-black text-center text-[10px] uppercase leading-tight tracking-tight">
                  COMPROMISO Y RESPONSABILIDAD DE PAGO
                </p>
                <p className="text-[9px] leading-[1.25] text-justify font-sans">
                  Por medio del presente documento, yo, <strong className="font-bold">{clientName}</strong>, con C.I./RUC <strong className="font-bold">{clientTaxId}</strong>, reconozco adeudar a <strong className="font-bold">DISTRIBUIDORA ANETH</strong> la suma líquida de <strong className="font-bold">${order.debtBalance.toFixed(2)} USD</strong> por concepto de la mercadería recibida a mi entera conformidad. Me obligo expresamente a cancelar el total pendiente el día <strong className="font-bold">{order.promisedCollectionDate || 'convenido'}</strong> en el horario pactado (<strong className="font-bold">{order.promisedCollectionTime || 'en ruta'}</strong>).
                </p>

                {/* SIGNATURE LINE */}
                <div className="pt-8 text-center space-y-0.5">
                  <div className="border-b border-black w-48 mx-auto" />
                  <p className="font-black text-[9.5px] uppercase">
                    FIRMA DEL CLIENTE / RECEPTOR
                  </p>
                  <p className="text-[9px]">
                    C.I.: ___________________________
                  </p>
                  <p className="text-[9px] font-bold truncate">
                    Nombre: {clientName}
                  </p>
                </div>
              </div>
            )}

            {/* QR CODE FOR DIGITAL SRI INVOICE & COMPROBANTE */}
            <div className="mt-3 pt-2 border-t border-dashed border-black text-center space-y-1">
              <div className="flex justify-center py-1">
                <QRCodeSVG
                  value={digitalInvoiceUrl}
                  size={110}
                  level="M"
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
              <p className="font-black text-[9.5px] uppercase leading-tight">
                Consulte su Comprobante Digital SRI
              </p>
              <p className="text-[8.5px] text-slate-700 leading-tight">
                Escanee el código QR desde su celular para descargar o verificar en línea
              </p>
              <p className="text-[7.5px] font-mono break-all text-slate-600">
                {digitalInvoiceUrl}
              </p>
            </div>

            {/* TICKET FOOTER */}
            <div className="mt-2 pt-1 border-t border-black text-center space-y-0.5 text-[9.5px]">
              <p className="font-black uppercase">¡GRACIAS POR SU PREFERENCIA!</p>
              <p className="text-[8.5px]">Distribuyendo las mejores bebidas y precios</p>
              <p className="text-[8px] font-bold">Ambato - Tungurahua - Ecuador</p>
              <p className="font-extrabold text-[13px] tracking-tighter leading-none pt-1">
                ================================
              </p>
            </div>
          </div>
        </div>

        {/* Footer info & tips */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between no-thermal-print">
          <span className="text-[11px] text-slate-500 font-medium">
            Compatible con Bluetooth / Cable USB en Munbyn IMP001
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
