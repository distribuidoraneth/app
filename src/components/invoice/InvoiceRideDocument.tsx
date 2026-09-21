'use client';

import React from 'react';
import { Invoice } from '@/types';
import {
  FacturaLine,
  formatCurrency,
  formatSriDate,
  formatSriDateTime,
} from '@/lib/utils/formatters';
import { DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
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
 * Divide las líneas de la factura de forma predecible y elegante en páginas A4.
 * Si tiene hasta 8 ítems, cabe perfectamente en 1 sola página completa con totales.
 * Si tiene más de 8 ítems, divide:
 * - Página 1: Encabezado oficial SRI completo + Cuadro cliente + Primeros 7 ítems.
 * - Página 2: Encabezado de continuación + Tabla de ítems con headers + Totales e Info.
 */
export function paginateFacturaLines(lines: FacturaLine[]): InvoicePageSlice[] {
  if (lines.length <= 8) {
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

  const pages: InvoicePageSlice[] = [];
  const PAGE_1_MAX = 7;
  const PAGE_N_MAX = 10;

  const page1Items = lines.slice(0, PAGE_1_MAX);
  let remaining = lines.slice(PAGE_1_MAX);

  const subPages: FacturaLine[][] = [];
  while (remaining.length > 0) {
    if (remaining.length <= PAGE_N_MAX) {
      subPages.push(remaining);
      break;
    } else {
      subPages.push(remaining.slice(0, 14));
      remaining = remaining.slice(14);
    }
  }

  const totalPages = 1 + subPages.length;

  pages.push({
    pageIndex: 0,
    pageNum: 1,
    totalPages,
    lines: page1Items,
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
}) => {
  const pages = paginateFacturaLines(facturaLines);

  return (
    <div id="invoice-printable-area" data-prevent-detector="true" className="w-full space-y-6 print:space-y-0">
      {pages.map((page, pIdx) => (
        <React.Fragment key={pIdx}>
          {pIdx > 0 && (
            <div className="flex items-center justify-center space-x-3 py-1 print:hidden text-xs font-bold text-slate-400">
              <span className="h-px bg-slate-200 flex-1" />
              <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                Página {page.pageNum} de {page.totalPages}
              </span>
              <span className="h-px bg-slate-200 flex-1" />
            </div>
          )}

          <div
            data-page-index={pIdx}
            className="invoice-pdf-page w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 p-4 sm:p-8 space-y-3.5 sm:space-y-4 text-slate-800 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none"
          >
            {/* PÁGINA 1: Encabezado Completo SRI (Emisor + Comprobante) */}
            {page.isFirst ? (
              <>
                <div className="invoice-header-block grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-stretch">
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
                <div className="invoice-buyer-block border border-slate-300 rounded-2xl p-3.5 sm:p-4 text-xs text-slate-800 bg-white">
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
              </>
            ) : (
              /* PÁGINAS SIGUIENTES (2+): Encabezado de Continuación con Estilo Oficial */
              <div className="border border-slate-300 rounded-2xl p-3 sm:p-4 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <AnethFullLogo size="sm" showSubtitle={false} />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-tight">
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

            {/* TABLA DE PRODUCTOS / ÍTEMS (Con Header Oficial Completo en CADA Página) */}
            <div className="invoice-table-block border border-slate-300 rounded-2xl overflow-x-auto bg-white print:overflow-visible scrollbar-thin">
              <table className="w-full min-w-[500px] sm:min-w-0 text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-blue-50/70 border-b border-blue-200/80 text-blue-950 text-[10px] sm:text-[10.5px] font-bold tracking-tight">
                    <th className="py-2 sm:py-2.5 px-2.5 sm:px-3 border-r border-blue-200/60 w-24 sm:w-28">Cod. Principal</th>
                    <th className="py-2 sm:py-2.5 px-2 border-r border-blue-200/60 text-right w-14 sm:w-16">Cantidad</th>
                    <th className="py-2 sm:py-2.5 px-2.5 sm:px-3 border-r border-blue-200/60">Descripción</th>
                    <th className="py-2 sm:py-2.5 px-2 border-r border-blue-200/60 text-right w-20 sm:w-24">Precio Unitario</th>
                    <th className="py-2 sm:py-2.5 px-2 border-r border-blue-200/60 text-right w-14 sm:w-16">Descuento</th>
                    <th className="py-2 sm:py-2.5 px-2.5 sm:px-3 text-right w-20 sm:w-24">Precio Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {page.lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 border-r border-slate-200 font-mono text-[10.5px] sm:text-[11px] font-semibold text-slate-800">
                        {line.codigoPrincipal}
                      </td>
                      <td className="py-1.5 sm:py-2 px-2 border-r border-slate-200 text-right font-mono text-[10.5px] sm:text-[11px]">
                        {line.cantidad.toFixed(2)}
                      </td>
                      <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 border-r border-slate-200 text-slate-900">
                        <span className="font-medium text-slate-900 block">{line.descripcion}</span>
                      </td>
                      <td className="py-1.5 sm:py-2 px-2 border-r border-slate-200 text-right font-mono text-[10.5px] sm:text-[11px]">
                        {line.precioUnitarioSinIva.toFixed(4)}
                      </td>
                      <td className="py-1.5 sm:py-2 px-2 border-r border-slate-200 text-right font-mono text-[10.5px] sm:text-[11px] text-slate-500">
                        0.00
                      </td>
                      <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 text-right font-mono font-semibold text-slate-900 text-[10.5px] sm:text-[11px]">
                        {line.precioTotalSinImpuesto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!page.isLast && (
                <div className="py-2 px-3 bg-slate-50/80 border-t border-slate-200 text-center font-bold text-xs text-slate-600 flex items-center justify-center space-x-2">
                  <span>Continúa en la página siguiente (Página {page.pageNum + 1} de {page.totalPages})</span>
                  <span>➔</span>
                </div>
              )}
            </div>

            {/* SECCIÓN INFERIOR: Totales SRI + Formas de Pago (ÚNICAMENTE en la Última Página) */}
            {page.isLast && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-start pt-1">
                {/* Columna Izquierda: Información Adicional + Formas de Pago */}
                <div className="space-y-2.5 sm:space-y-3">
                  {/* Información Adicional */}
                  <div className="invoice-info-block border border-slate-300 rounded-2xl p-3 sm:p-3.5 text-xs space-y-1 sm:space-y-1.5 bg-white">
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

                  {/* Tabla Forma de Pago (con acento azul de marca) */}
                  <div className="invoice-payments-block border border-slate-300 rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-blue-50/70 border-b border-blue-200/80 text-blue-950 text-[10.5px] font-bold tracking-tight">
                          <th className="py-2 px-3 border-r border-blue-200/60">Forma de pago</th>
                          <th className="py-2 px-3 text-right w-24">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 px-3 border-r border-slate-200 text-[11px] text-slate-800">
                            20 - OTROS CON UTILIZACION DEL SISTEMA FINANCIERO
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(invoice.total)}
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
                        <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                          SUBTOTAL 15%
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900 w-28">
                          {subtotal15.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                          SUBTOTAL 0%
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500 w-28">
                          0.00
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                          SUBTOTAL NO OBJETO DE IVA
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500 w-28">
                          0.00
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                          SUBTOTAL EXENTO DE IVA
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500 w-28">
                          0.00
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                          SUBTOTAL SIN IMPUESTOS
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900 w-28">
                          {subtotal15.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                          TOTAL DESCUENTO
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500 w-28">
                          0.00
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                          IVA 15%
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900 w-28">
                          {totalIva15.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-blue-50/70 font-black text-slate-900 text-xs sm:text-sm">
                        <td className="py-2.5 px-3 text-blue-950 font-black border-r border-blue-200/80">
                          VALOR TOTAL
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-blue-900 text-sm sm:text-base w-28">
                          ${invoice.total.toFixed(2)}
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
        </React.Fragment>
      ))}
    </div>
  );
};
