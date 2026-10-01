'use client';

import React from 'react';
import { Invoice } from '@/types';
import {
  FacturaLine,
  formatCurrency,
  formatSriDate,
  formatSriDateTime,
} from '@/lib/utils/formatters';
import { DEFAULT_TAX_PROFILE, getSriPaymentMethodInfo } from '@/lib/sri/xmlBuilder';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { SriBarcodeSVG } from '@/components/ui/SriBarcodeSVG';

export interface InvoiceRideDocumentProps {
  invoice: Invoice;
  facturaLines: FacturaLine[];
  sriAuthNum?: string | null;
  sriAuthDate?: string | null;
  claveAcceso: string;
  subtotal15: number;
  totalIva15: number;
  paymentMethod?: string;
}

export interface InvoicePageSlice {
  pageIndex: number;
  pageNum: number;
  totalPages: number;
  lines: FacturaLine[];
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Paginación equilibrada exclusiva para PDF e impresión A4:
 * - Hasta 13 ítems: 1 sola página completa con totales (sin saltos innecesarios).
 * - De 14 a 46 ítems (cubre todo el catálogo de productos): Exactamente 2 páginas perfectamente balanceadas.
 *   Los totales equivalen a ~6 filas; por eso la página 1 lleva ligeramente más ítems que la página 2,
 *   logrando que ambas hojas tengan exactamente la misma altura visual y cero espacios muertos.
 * - Más de 46 ítems: 3 o más páginas con distribución continua.
 */
export function paginateFacturaLines(lines: FacturaLine[]): InvoicePageSlice[] {
  const total = lines.length;

  // Caso 1: 1 sola página completa con totales
  if (total <= 13) {
    return [
      {
        pageIndex: 0,
        pageNum: 1,
        totalPages: 1,
        lines,
        isFirst: true,
        isLast: true,
      },
    ];
  }

  // Caso 2: 2 páginas balanceadas (14 a 46 ítems)
  if (total <= 46) {
    // Equilibrar altura visual: page1Count ≈ (total + 6) / 2
    let page1Count = Math.round((total + 6) / 2);
    page1Count = Math.max(10, Math.min(24, page1Count));

    return [
      {
        pageIndex: 0,
        pageNum: 1,
        totalPages: 2,
        lines: lines.slice(0, page1Count),
        isFirst: true,
        isLast: false,
      },
      {
        pageIndex: 1,
        pageNum: 2,
        totalPages: 2,
        lines: lines.slice(page1Count),
        isFirst: false,
        isLast: true,
      },
    ];
  }

  // Caso 3: Facturas masivas (> 46 ítems)
  const pages: InvoicePageSlice[] = [];
  const P1_MAX = 22;
  const PN_MAX = 24;

  const p1Items = lines.slice(0, P1_MAX);
  let remaining = lines.slice(P1_MAX);

  const subPages: FacturaLine[][] = [];
  while (remaining.length > 0) {
    if (remaining.length <= PN_MAX) {
      subPages.push(remaining);
      break;
    } else {
      subPages.push(remaining.slice(0, PN_MAX));
      remaining = remaining.slice(PN_MAX);
    }
  }

  const totalPages = 1 + subPages.length;

  pages.push({
    pageIndex: 0,
    pageNum: 1,
    totalPages,
    lines: p1Items,
    isFirst: true,
    isLast: false,
  });

  subPages.forEach((pLines, idx) => {
    pages.push({
      pageIndex: idx + 1,
      pageNum: idx + 2,
      totalPages,
      lines: pLines,
      isFirst: false,
      isLast: idx === subPages.length - 1,
    });
  });

  return pages;
}

export const InvoiceRideDocument: React.FC<InvoiceRideDocumentProps> = ({
  invoice,
  facturaLines,
  sriAuthNum,
  sriAuthDate,
  claveAcceso,
  subtotal15,
  totalIva15,
  paymentMethod,
}) => {
  const pages = paginateFacturaLines(facturaLines);
  const paymentInfo = getSriPaymentMethodInfo(paymentMethod || invoice.paymentMethod);

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. VISTA WEB / MÓVIL (En pantalla): UNA SOLA TARJETA CONTINUA Y ELEGANTE  */}
      {/* Scroll natural, sin cortes ni separadores en pantalla                     */}
      {/* ========================================================================= */}
      <div
        data-prevent-detector="true"
        className="invoice-web-view w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 p-4 sm:p-8 space-y-3.5 sm:space-y-4 text-slate-800 print:hidden"
      >
        {/* Encabezado Principal: Emisor (Izquierda) + Factura SRI (Derecha) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-stretch">
          {/* Columna Izquierda: Logo + Cuadro Emisor */}
          <div className="flex flex-col justify-between space-y-2.5 sm:space-y-3">
            <div className="py-1 px-0.5">
              <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUCIONES" />
            </div>

            <div className="border border-slate-300 rounded-2xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2 text-xs text-slate-800 bg-white flex-1 flex flex-col justify-center">
              <div>
                <h2 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight uppercase">
                  {DEFAULT_TAX_PROFILE.razonSocial}
                </h2>
                <p className="font-semibold text-slate-900 mt-0.5">
                  <span className="text-slate-600 font-normal">R.U.C.: </span>
                  {DEFAULT_TAX_PROFILE.ruc}
                </p>
                <p className="font-bold text-slate-800 mt-0.5 tracking-tight">
                  {DEFAULT_TAX_PROFILE.nombreComercial || 'ANETH DISTRIBUCIONES'}
                </p>
              </div>

              <div className="space-y-1 text-[11px] text-slate-700 pt-1 border-t border-slate-100">
                <p>
                  <strong className="text-slate-900">Dirección Matriz:</strong>{' '}
                  {DEFAULT_TAX_PROFILE.dirMatriz}
                </p>
                {DEFAULT_TAX_PROFILE.dirEstablecimiento && (
                  <p>
                    <strong className="text-slate-900">Dirección Sucursal:</strong>{' '}
                    {DEFAULT_TAX_PROFILE.dirEstablecimiento}
                  </p>
                )}
                <p>
                  <strong className="text-slate-900">OBLIGADO A LLEVAR CONTABILIDAD:</strong>{' '}
                  {DEFAULT_TAX_PROFILE.obligadoContabilidad}
                </p>
                <p className="font-bold text-slate-900 pt-0.5 tracking-wide">
                  RÉGIMEN GENERAL
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Cuadro Oficial SRI */}
          <div className="border border-slate-300 rounded-2xl p-3.5 sm:p-4 text-xs text-slate-800 bg-white flex flex-col justify-between space-y-2.5 sm:space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                <span className="text-slate-600 font-normal">R.U.C.: </span>
                {DEFAULT_TAX_PROFILE.ruc}
              </p>
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                FACTURA
              </h1>
              <p className="font-mono font-bold text-xs text-slate-900 whitespace-nowrap">
                No. {invoice.invoiceNumber}
              </p>

              <div className="pt-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                  NÚMERO DE AUTORIZACIÓN
                </span>
                <span className="font-mono text-[10.5px] sm:text-[11px] text-slate-900 font-bold block break-all leading-tight">
                  {sriAuthNum || claveAcceso}
                </span>
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <p>
                  <strong className="text-slate-900">FECHA Y HORA DE AUTORIZACIÓN:</strong>{' '}
                  <span className="font-mono">
                    {sriAuthDate ? formatSriDateTime(sriAuthDate) : formatSriDateTime(invoice.issuedAt)}
                  </span>
                </p>
                <p>
                  <strong className="text-slate-900">AMBIENTE:</strong>{' '}
                  <span>{invoice.ambiente === '2' ? 'PRODUCCIÓN' : 'PRUEBAS'}</span>
                </p>
                <p>
                  <strong className="text-slate-900">EMISIÓN:</strong>{' '}
                  <span>NORMAL</span>
                </p>
              </div>
            </div>

            {/* Código de barras y Clave de Acceso */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                CLAVE DE ACCESO
              </span>
              <div className="w-full bg-white py-0.5 overflow-hidden">
                <SriBarcodeSVG value={claveAcceso} className="w-full h-10 sm:h-11" />
              </div>
              <span className="font-mono text-[9.5px] sm:text-[10px] text-slate-900 font-medium block text-center tracking-tight select-all mt-0.5 break-all">
                {claveAcceso}
              </span>
            </div>
          </div>
        </div>

        {/* Cuadro Comprador / Cliente (Oficial SRI) */}
        <div className="border border-slate-300 rounded-2xl p-3.5 sm:p-4 text-xs text-slate-800 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 sm:gap-y-2">
            <div className="sm:col-span-2">
              <span className="font-bold text-slate-900">Razón Social / Nombres y Apellidos:</span>{' '}
              <span className="font-medium text-slate-900">{invoice.clientName}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Identificación:</span>{' '}
              <span className="font-mono font-medium text-slate-900">{invoice.clientTaxId || '9999999999999'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Fecha:</span>{' '}
              <span className="font-mono font-medium text-slate-900">{formatSriDate(invoice.issuedAt)}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-bold text-slate-900">Dirección:</span>{' '}
              <span className="font-medium text-slate-800">{invoice.clientAddress || 'Ambato, Ecuador'}</span>
            </div>
          </div>
        </div>

        {/* TABLA COMPLETA CONTINUA: Todos los ítems en una sola tabla limpia para pantalla */}
        <div className="border border-slate-300 rounded-2xl overflow-x-auto bg-white scrollbar-thin">
          <table className="w-full min-w-[500px] sm:min-w-0 text-xs text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/70 border-b border-blue-200/80 text-blue-950 text-[10px] sm:text-[10.5px] font-bold tracking-tight">
                <th className="px-3 border-r border-blue-200/60 w-24 sm:w-28 align-middle">
                  <div className="h-full min-h-[30px] flex items-center">Cod. Principal</div>
                </th>
                <th className="px-2 border-r border-blue-200/60 text-right w-14 sm:w-16 align-middle">
                  <div className="h-full min-h-[30px] flex items-center justify-end">Cantidad</div>
                </th>
                <th className="px-3 border-r border-blue-200/60 align-middle">
                  <div className="h-full min-h-[30px] flex items-center">Descripción</div>
                </th>
                <th className="px-2.5 border-r border-blue-200/60 text-right w-20 sm:w-24 align-middle">
                  <div className="h-full min-h-[30px] flex items-center justify-end">Precio Unitario</div>
                </th>
                <th className="px-2 border-r border-blue-200/60 text-right w-14 sm:w-16 align-middle">
                  <div className="h-full min-h-[30px] flex items-center justify-end">Descuento</div>
                </th>
                <th className="px-3 text-right w-20 sm:w-24 align-middle">
                  <div className="h-full min-h-[30px] flex items-center justify-end">Precio Total</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {facturaLines.map((line, idx) => {
                const isPromoLine = Boolean(line.isPromo) || line.precioTotalSinImpuesto === 0 || line.descripcion.includes('[BONIFICACIÓN GRATIS]');
                return (
                  <tr key={idx} className={`hover:bg-slate-50/50 ${isPromoLine ? 'bg-emerald-50/25' : ''}`}>
                    <td className="px-3 border-r border-slate-200 align-middle">
                      <div className="h-full min-h-[32px] flex items-center font-mono text-[10.5px] sm:text-[11px] font-semibold text-slate-800">
                        {line.codigoPrincipal}
                      </div>
                    </td>
                    <td className="px-2 border-r border-slate-200 align-middle">
                      <div className="h-full min-h-[32px] flex items-center justify-end font-mono text-[10.5px] sm:text-[11px]">
                        {line.cantidad.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-3 border-r border-slate-200 align-middle">
                      <div className="h-full min-h-[32px] py-1.5 flex items-center flex-wrap gap-1.5 text-slate-900 text-xs font-medium leading-snug">
                        <span>{line.descripcion.replace(/\s*\[BONIFICACIÓN GRATIS\]/g, '')}</span>
                        {isPromoLine && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            PROMO GRATIS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2.5 border-r border-slate-200 align-middle">
                      <div className={`h-full min-h-[32px] flex items-center justify-end font-mono text-[10.5px] sm:text-[11px] ${isPromoLine ? 'text-emerald-700 font-bold' : ''}`}>
                        {isPromoLine ? '0.00' : line.precioUnitarioSinIva.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-2 border-r border-slate-200 align-middle">
                      <div className="h-full min-h-[32px] flex items-center justify-end font-mono text-[10.5px] sm:text-[11px] text-slate-500">
                        0.00
                      </div>
                    </td>
                    <td className="px-3 align-middle">
                      <div className={`h-full min-h-[32px] flex items-center justify-end font-mono font-semibold text-[10.5px] sm:text-[11px] ${isPromoLine ? 'text-emerald-700 font-bold' : 'text-slate-900'}`}>
                        {isPromoLine ? '0.00' : line.precioTotalSinImpuesto.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Sección Inferior: Info Adicional + Formas de Pago (Izquierda) / Totales SRI (Derecha) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-start pt-1">
          {/* Columna Izquierda: Información Adicional + Formas de Pago */}
          <div className="space-y-2.5 sm:space-y-3">
            {/* Información Adicional */}
            <div className="border border-slate-300 rounded-2xl p-3 sm:p-3.5 text-xs space-y-1 sm:space-y-1.5 bg-white">
              <h4 className="font-bold text-blue-950 text-[11px] uppercase tracking-wide border-b border-blue-100 pb-1">
                Información Adicional
              </h4>
              <div className="space-y-1 text-[11px] text-slate-700 pt-0.5">
                {invoice.clientEmail && (
                  <p><strong className="text-slate-900">Email:</strong> {invoice.clientEmail}</p>
                )}
                {invoice.clientWhatsapp && (
                  <p><strong className="text-slate-900">Teléfono:</strong> {invoice.clientWhatsapp}</p>
                )}
                {invoice.clientAddress && (
                  <p><strong className="text-slate-900">Dirección:</strong> {invoice.clientAddress}</p>
                )}
                <p><strong className="text-slate-900">Distribuidor:</strong> ANETH Distribuciones</p>
              </div>
            </div>

            {/* Tabla Forma de Pago */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-blue-50/70 border-b border-blue-200/80 text-blue-950 text-[10.5px] font-bold tracking-tight">
                    <th className="px-3 border-r border-blue-200/60 align-middle">
                      <div className="h-full min-h-[28px] flex items-center">Forma de pago</div>
                    </th>
                    <th className="px-3 text-right w-24 align-middle">
                      <div className="h-full min-h-[28px] flex items-center justify-end">Valor</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 border-r border-slate-200 align-middle">
                      <div className="h-full min-h-[32px] py-1 flex items-center text-[10.5px] sm:text-[11px] text-slate-800 leading-snug">
                        {paymentInfo.name}
                      </div>
                    </td>
                    <td className="px-3 align-middle">
                      <div className="h-full min-h-[32px] flex items-center justify-end font-mono font-bold text-slate-900">
                        {formatCurrency(invoice.total)}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Columna Derecha: Totales SRI Oficiales */}
          <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white">
            <table className="w-full text-xs border-collapse">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-3 border-r border-slate-200 align-middle">
                    <div className="h-full min-h-[28px] flex items-center font-semibold text-slate-700 text-[11px]">
                      SUBTOTAL 15%
                    </div>
                  </td>
                  <td className="px-3 w-28 align-middle">
                    <div className="h-full min-h-[28px] flex items-center justify-end font-mono font-medium text-slate-900">
                      {subtotal15.toFixed(2)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 border-r border-slate-200 align-middle">
                    <div className="h-full min-h-[28px] flex items-center font-semibold text-slate-700 text-[11px]">
                      SUBTOTAL 0%
                    </div>
                  </td>
                  <td className="px-3 w-28 align-middle">
                    <div className="h-full min-h-[28px] flex items-center justify-end font-mono text-slate-500">
                      0.00
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 border-r border-slate-200 align-middle">
                    <div className="h-full min-h-[28px] flex items-center font-semibold text-slate-700 text-[11px]">
                      SUBTOTAL NO OBJETO DE IVA
                    </div>
                  </td>
                  <td className="px-3 w-28 align-middle">
                    <div className="h-full min-h-[28px] flex items-center justify-end font-mono text-slate-500">
                      0.00
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 border-r border-slate-200 align-middle">
                    <div className="h-full min-h-[28px] flex items-center font-semibold text-slate-700 text-[11px]">
                      SUBTOTAL EXENTO DE IVA
                    </div>
                  </td>
                  <td className="px-3 w-28 align-middle">
                    <div className="h-full min-h-[28px] flex items-center justify-end font-mono text-slate-500">
                      0.00
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 border-r border-slate-200 align-middle">
                    <div className="h-full min-h-[28px] flex items-center font-semibold text-slate-700 text-[11px]">
                      SUBTOTAL SIN IMPUESTOS
                    </div>
                  </td>
                  <td className="px-3 w-28 align-middle">
                    <div className="h-full min-h-[28px] flex items-center justify-end font-mono font-medium text-slate-900">
                      {subtotal15.toFixed(2)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 border-r border-slate-200 align-middle">
                    <div className="h-full min-h-[28px] flex items-center font-semibold text-slate-700 text-[11px]">
                      TOTAL DESCUENTO
                    </div>
                  </td>
                  <td className="px-3 w-28 align-middle">
                    <div className="h-full min-h-[28px] flex items-center justify-end font-mono text-slate-500">
                      0.00
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 border-r border-slate-200 align-middle">
                    <div className="h-full min-h-[28px] flex items-center font-semibold text-slate-700 text-[11px]">
                      IVA 15%
                    </div>
                  </td>
                  <td className="px-3 w-28 align-middle">
                    <div className="h-full min-h-[28px] flex items-center justify-end font-mono font-medium text-slate-900">
                      {totalIva15.toFixed(2)}
                    </div>
                  </td>
                </tr>
                <tr className="bg-blue-50/70 font-black text-slate-900">
                  <td className="px-3 border-r border-blue-200/80 align-middle">
                    <div className="h-full min-h-[34px] flex items-center text-blue-950 font-black text-xs sm:text-sm">
                      VALOR TOTAL
                    </div>
                  </td>
                  <td className="px-3 w-28 align-middle">
                    <div className="h-full min-h-[34px] flex items-center justify-end font-mono font-black text-blue-900 text-sm sm:text-base">
                      ${invoice.total.toFixed(2)}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie de página web */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span>Distribuidora Aneth • R.U.C. {DEFAULT_TAX_PROFILE.ruc}</span>
          <span className="font-semibold text-slate-500">Documento Oficial SRI</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VISTA PDF / IMPRESIÓN (Paginada): Oculta en pantalla, activa para PDF  */}
      {/* Altura natural sin espacios forzados, texto legible 100% sin recortes      */}
      {/* ========================================================================= */}
      <div
        id="invoice-printable-area"
        data-prevent-detector="true"
        className="invoice-pdf-container print:block"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '794px',
          pointerEvents: 'none',
          zIndex: -9999,
        }}
      >
        {pages.map((page, pIdx) => (
          <div
            key={pIdx}
            data-page-index={pIdx}
            className="invoice-pdf-page w-full bg-white p-6 space-y-3 text-slate-800"
            style={{ width: '794px', boxSizing: 'border-box' }}
          >
            {/* PÁGINA 1: Encabezado Oficial Completo SRI */}
            {page.isFirst ? (
              <>
                <div className="invoice-header-block grid grid-cols-2 gap-3.5 items-stretch">
                  {/* Columna Izquierda: Logo + Cuadro Emisor */}
                  <div className="flex flex-col justify-between space-y-2">
                    <div className="py-0.5 px-0.5">
                      <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUCIONES" />
                    </div>

                    <div className="border border-slate-300 rounded-2xl p-3 space-y-1 text-xs text-slate-800 bg-white flex-1 flex flex-col justify-center">
                      <div>
                        <h2 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase">
                          {DEFAULT_TAX_PROFILE.razonSocial}
                        </h2>
                        <p className="font-semibold text-slate-900 mt-0.5">
                          <span className="text-slate-600 font-normal">R.U.C.: </span>
                          {DEFAULT_TAX_PROFILE.ruc}
                        </p>
                        <p className="font-bold text-slate-800 mt-0.5 tracking-tight">
                          {DEFAULT_TAX_PROFILE.nombreComercial || 'ANETH DISTRIBUCIONES'}
                        </p>
                      </div>

                      <div className="space-y-0.5 text-[11px] text-slate-700 pt-1 border-t border-slate-100">
                        <p>
                          <strong className="text-slate-900">Dirección Matriz:</strong>{' '}
                          {DEFAULT_TAX_PROFILE.dirMatriz}
                        </p>
                        {DEFAULT_TAX_PROFILE.dirEstablecimiento && (
                          <p>
                            <strong className="text-slate-900">Dirección Sucursal:</strong>{' '}
                            {DEFAULT_TAX_PROFILE.dirEstablecimiento}
                          </p>
                        )}
                        <p>
                          <strong className="text-slate-900">OBLIGADO A LLEVAR CONTABILIDAD:</strong>{' '}
                          {DEFAULT_TAX_PROFILE.obligadoContabilidad}
                        </p>
                        <p className="font-bold text-slate-900 pt-0.5 tracking-wide">
                          RÉGIMEN GENERAL
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Cuadro Oficial SRI */}
                  <div className="border border-slate-300 rounded-2xl p-3 text-xs text-slate-800 bg-white flex flex-col justify-between space-y-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">
                        <span className="text-slate-600 font-normal">R.U.C.: </span>
                        {DEFAULT_TAX_PROFILE.ruc}
                      </p>
                      <h1 className="text-sm font-black text-slate-900 tracking-tight">
                        FACTURA
                      </h1>
                      <p className="font-mono font-bold text-xs text-slate-900 whitespace-nowrap">
                        No. {invoice.invoiceNumber}
                      </p>

                      <div className="pt-0.5">
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                          NÚMERO DE AUTORIZACIÓN
                        </span>
                        <span className="font-mono text-[10.5px] text-slate-900 font-bold block break-all leading-tight">
                          {sriAuthNum || claveAcceso}
                        </span>
                      </div>

                      <div className="space-y-0.5 text-[10.5px] pt-0.5">
                        <p>
                          <strong className="text-slate-900">FECHA Y HORA DE AUTORIZACIÓN:</strong>{' '}
                          <span className="font-mono">
                            {sriAuthDate ? formatSriDateTime(sriAuthDate) : formatSriDateTime(invoice.issuedAt)}
                          </span>
                        </p>
                        <p>
                          <strong className="text-slate-900">AMBIENTE:</strong>{' '}
                          <span>{invoice.ambiente === '2' ? 'PRODUCCIÓN' : 'PRUEBAS'}</span>
                        </p>
                        <p>
                          <strong className="text-slate-900">EMISIÓN:</strong>{' '}
                          <span>NORMAL</span>
                        </p>
                      </div>
                    </div>

                    {/* Código de barras y Clave de Acceso */}
                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider block mb-0.5">
                        CLAVE DE ACCESO
                      </span>
                      <div className="w-full bg-white py-0.5 overflow-hidden">
                        <SriBarcodeSVG value={claveAcceso} className="w-full h-10" />
                      </div>
                      <span className="font-mono text-[9.5px] text-slate-900 font-medium block text-center tracking-tight select-all mt-0.5 break-all">
                        {claveAcceso}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cuadro Comprador / Cliente (Oficial SRI) */}
                <div className="invoice-buyer-block border border-slate-300 rounded-2xl p-2.5 text-xs text-slate-800 bg-white">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                    <div className="col-span-2">
                      <span className="font-bold text-slate-900">Razón Social / Nombres y Apellidos:</span>{' '}
                      <span className="font-medium text-slate-900">{invoice.clientName}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Identificación:</span>{' '}
                      <span className="font-mono font-medium text-slate-900">{invoice.clientTaxId || '9999999999999'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Fecha:</span>{' '}
                      <span className="font-mono font-medium text-slate-900">{formatSriDate(invoice.issuedAt)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-bold text-slate-900">Dirección:</span>{' '}
                      <span className="font-medium text-slate-800">{invoice.clientAddress || 'Ambato, Ecuador'}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* PÁGINAS SIGUIENTES (2+): Encabezado de Continuación con Estilo Oficial */
              <div className="border border-slate-300 rounded-2xl p-2.5 bg-slate-50/70 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <AnethFullLogo size="sm" showSubtitle={false} />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">
                      {DEFAULT_TAX_PROFILE.razonSocial}
                    </h3>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Factura No.{' '}
                      <span className="font-mono text-slate-900 font-bold">{invoice.invoiceNumber}</span>{' '}
                      <span className="text-slate-400">•</span> (Continuación)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-800 font-bold">
                    Cliente:{' '}
                    <span className="font-semibold text-slate-900">{invoice.clientName}</span>
                  </p>
                  <div className="flex items-center justify-end space-x-2 mt-0.5">
                    <span className="font-mono text-[11px] text-slate-600">
                      RUC/CI: {invoice.clientTaxId || '9999999999999'}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-black rounded-md text-[10px] uppercase">
                      Página {page.pageNum} de {page.totalPages}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TABLA DE PRODUCTOS / ÍTEMS: Texto 100% legible sin recortes ni overflow */}
            <div className="invoice-table-block border border-slate-300 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-blue-50/70 border-b border-blue-200/80 text-blue-950 text-[10px] font-bold tracking-tight">
                    <th className="px-2.5 border-r border-blue-200/60 w-24 align-middle">
                      <div className="h-full min-h-[28px] flex items-center">Cod. Principal</div>
                    </th>
                    <th className="px-2 border-r border-blue-200/60 text-right w-14 align-middle">
                      <div className="h-full min-h-[28px] flex items-center justify-end">Cantidad</div>
                    </th>
                    <th className="px-2.5 border-r border-blue-200/60 align-middle">
                      <div className="h-full min-h-[28px] flex items-center">Descripción</div>
                    </th>
                    <th className="px-2 border-r border-blue-200/60 text-right w-20 align-middle">
                      <div className="h-full min-h-[28px] flex items-center justify-end">Precio Unitario</div>
                    </th>
                    <th className="px-2 border-r border-blue-200/60 text-right w-14 align-middle">
                      <div className="h-full min-h-[28px] flex items-center justify-end">Descuento</div>
                    </th>
                    <th className="px-2.5 text-right w-20 align-middle">
                      <div className="h-full min-h-[28px] flex items-center justify-end">Precio Total</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {page.lines.map((line, idx) => {
                    const isPromoLine = Boolean(line.isPromo) || line.precioTotalSinImpuesto === 0 || line.descripcion.includes('[BONIFICACIÓN GRATIS]');
                    return (
                      <tr key={idx} className={`hover:bg-slate-50/50 ${isPromoLine ? 'bg-emerald-50/20' : ''}`}>
                        <td className="px-2.5 border-r border-slate-200 align-middle">
                          <div className="h-full min-h-[28px] flex items-center font-mono text-[10.5px] font-semibold text-slate-800">
                            {line.codigoPrincipal}
                          </div>
                        </td>
                        <td className="px-2 border-r border-slate-200 align-middle">
                          <div className="h-full min-h-[28px] flex items-center justify-end font-mono text-[10.5px]">
                            {line.cantidad.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-2.5 border-r border-slate-200 align-middle">
                          <div className="h-full min-h-[28px] py-1 flex items-center flex-wrap gap-1 text-slate-900 text-[11px] font-medium leading-snug">
                            <span>{line.descripcion.replace(/\s*\[BONIFICACIÓN GRATIS\]/g, '')}</span>
                            {isPromoLine && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                BONIFICACIÓN GRATIS
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 border-r border-slate-200 align-middle">
                          <div className={`h-full min-h-[28px] flex items-center justify-end font-mono text-[10.5px] ${isPromoLine ? 'text-emerald-700 font-bold' : ''}`}>
                            {isPromoLine ? '0.00' : line.precioUnitarioSinIva.toFixed(4)}
                          </div>
                        </td>
                        <td className="px-2 border-r border-slate-200 align-middle">
                          <div className="h-full min-h-[28px] flex items-center justify-end font-mono text-[10.5px] text-slate-500">
                            0.00
                          </div>
                        </td>
                        <td className="px-2.5 align-middle">
                          <div className={`h-full min-h-[28px] flex items-center justify-end font-mono font-semibold text-[10.5px] ${isPromoLine ? 'text-emerald-700 font-bold' : 'text-slate-900'}`}>
                            {isPromoLine ? '0.00' : line.precioTotalSinImpuesto.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!page.isLast && (
                <div className="py-1 px-3 bg-slate-50/80 border-t border-slate-200 text-center font-bold text-[11px] text-slate-600 flex items-center justify-center space-x-2">
                  <span>Continúa en la página siguiente (Página {page.pageNum + 1} de {page.totalPages})</span>
                  <span>➔</span>
                </div>
              )}
            </div>

            {/* SECCIÓN INFERIOR: Totales SRI + Formas de Pago (ÚNICAMENTE en la Última Página) */}
            {page.isLast && (
              <div className="grid grid-cols-2 gap-3 items-start pt-0.5">
                {/* Columna Izquierda: Información Adicional + Formas de Pago */}
                <div className="space-y-2">
                  <div className="invoice-info-block border border-slate-300 rounded-2xl p-2.5 text-xs space-y-0.5 bg-white">
                    <h4 className="font-bold text-blue-950 text-[10.5px] uppercase tracking-wide border-b border-blue-100 pb-0.5">
                      Información Adicional
                    </h4>
                    <div className="space-y-0.5 text-[10.5px] text-slate-700 pt-0.5">
                      {invoice.clientEmail && (
                        <p><strong className="text-slate-900">Email:</strong> {invoice.clientEmail}</p>
                      )}
                      {invoice.clientWhatsapp && (
                        <p><strong className="text-slate-900">Teléfono:</strong> {invoice.clientWhatsapp}</p>
                      )}
                      {invoice.clientAddress && (
                        <p><strong className="text-slate-900">Dirección:</strong> {invoice.clientAddress}</p>
                      )}
                      <p><strong className="text-slate-900">Distribuidor:</strong> ANETH Distribuciones</p>
                    </div>
                  </div>

                  <div className="invoice-payments-block border border-slate-300 rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-blue-50/70 border-b border-blue-200/80 text-blue-950 text-[10px] font-bold tracking-tight">
                          <th className="px-3 border-r border-blue-200/60 align-middle">
                            <div className="h-full min-h-[26px] flex items-center">Forma de pago</div>
                          </th>
                          <th className="px-3 text-right w-24 align-middle">
                            <div className="h-full min-h-[26px] flex items-center justify-end">Valor</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-3 border-r border-slate-200 align-middle">
                            <div className="h-full min-h-[28px] py-1 flex items-center text-[10.5px] text-slate-800 leading-snug">
                              {paymentInfo.name}
                            </div>
                          </td>
                          <td className="px-3 align-middle">
                            <div className="h-full min-h-[28px] flex items-center justify-end font-mono font-bold text-slate-900">
                              {formatCurrency(invoice.total)}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Columna Derecha: Totales SRI Oficiales */}
                <div className="invoice-totals-block border border-slate-300 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-xs border-collapse">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="px-2.5 border-r border-slate-200 align-middle">
                          <div className="h-full min-h-[26px] flex items-center font-semibold text-slate-700 text-[10.5px]">
                            SUBTOTAL 15%
                          </div>
                        </td>
                        <td className="px-2.5 w-24 align-middle">
                          <div className="h-full min-h-[26px] flex items-center justify-end font-mono font-medium text-slate-900">
                            {subtotal15.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2.5 border-r border-slate-200 align-middle">
                          <div className="h-full min-h-[26px] flex items-center font-semibold text-slate-700 text-[10.5px]">
                            SUBTOTAL 0%
                          </div>
                        </td>
                        <td className="px-2.5 w-24 align-middle">
                          <div className="h-full min-h-[26px] flex items-center justify-end font-mono text-slate-500">
                            0.00
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2.5 border-r border-slate-200 align-middle">
                          <div className="h-full min-h-[26px] flex items-center font-semibold text-slate-700 text-[10.5px]">
                            SUBTOTAL NO OBJETO DE IVA
                          </div>
                        </td>
                        <td className="px-2.5 w-24 align-middle">
                          <div className="h-full min-h-[26px] flex items-center justify-end font-mono text-slate-500">
                            0.00
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2.5 border-r border-slate-200 align-middle">
                          <div className="h-full min-h-[26px] flex items-center font-semibold text-slate-700 text-[10.5px]">
                            SUBTOTAL EXENTO DE IVA
                          </div>
                        </td>
                        <td className="px-2.5 w-24 align-middle">
                          <div className="h-full min-h-[26px] flex items-center justify-end font-mono text-slate-500">
                            0.00
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2.5 border-r border-slate-200 align-middle">
                          <div className="h-full min-h-[26px] flex items-center font-semibold text-slate-700 text-[10.5px]">
                            SUBTOTAL SIN IMPUESTOS
                          </div>
                        </td>
                        <td className="px-2.5 w-24 align-middle">
                          <div className="h-full min-h-[26px] flex items-center justify-end font-mono font-medium text-slate-900">
                            {subtotal15.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2.5 border-r border-slate-200 align-middle">
                          <div className="h-full min-h-[26px] flex items-center font-semibold text-slate-700 text-[10.5px]">
                            TOTAL DESCUENTO
                          </div>
                        </td>
                        <td className="px-2.5 w-24 align-middle">
                          <div className="h-full min-h-[26px] flex items-center justify-end font-mono text-slate-500">
                            0.00
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2.5 border-r border-slate-200 align-middle">
                          <div className="h-full min-h-[26px] flex items-center font-semibold text-slate-700 text-[10.5px]">
                            IVA 15%
                          </div>
                        </td>
                        <td className="px-2.5 w-24 align-middle">
                          <div className="h-full min-h-[26px] flex items-center justify-end font-mono font-medium text-slate-900">
                            {totalIva15.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                      <tr className="bg-blue-50/70 font-black text-slate-900 text-xs">
                        <td className="px-2.5 border-r border-blue-200/80 align-middle">
                          <div className="h-full min-h-[30px] flex items-center text-blue-950 font-black text-xs">
                            VALOR TOTAL
                          </div>
                        </td>
                        <td className="px-2.5 w-24 align-middle">
                          <div className="h-full min-h-[30px] flex items-center justify-end font-mono font-black text-blue-900 text-xs sm:text-sm">
                            ${invoice.total.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pie de Página A4 */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>Distribuidora Aneth • R.U.C. {DEFAULT_TAX_PROFILE.ruc}</span>
              <span className="font-bold text-slate-600">
                Página {page.pageNum} de {page.totalPages}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
