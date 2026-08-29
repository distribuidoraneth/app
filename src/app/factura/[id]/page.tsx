'use client';

import React, { use } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { formatCurrency, formatDate, generateWhatsAppOrderLink } from '@/lib/utils/formatters';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { Printer, Share2, ShieldCheck, CheckCircle2, ArrowLeft, Building2 } from 'lucide-react';

export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { invoices } = useDistribution();

  const invoice =
    invoices.find((i) => i.invoiceNumber === resolvedParams.id || i.id === resolvedParams.id) ||
    invoices[0];

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!invoice) return;
    const link = generateWhatsAppOrderLink({
      phone: invoice.clientWhatsapp,
      clientName: invoice.clientName,
      orderNumber: invoice.orderId,
      total: invoice.total,
      invoiceNumber: invoice.invoiceNumber,
    });
    window.open(link, '_blank');
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm">
          <h2 className="font-bold text-slate-800">Factura no encontrada</h2>
          <p className="text-xs text-slate-500 mt-1">El folio consultado no existe o fue anulado.</p>
          <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center">
      {/* Top action bar (hidden in print) */}
      <div className="print:hidden w-full max-w-2xl bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Sistema</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div
        id="invoice-printable-area"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6 text-slate-800"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                A
              </div>
              <h2 className="text-xl font-black tracking-tight">DISTRIBUIDORA ANETH</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Distribución de Bebidas en Javas (Colas, Aguas y Tés)
            </p>
            <p className="text-xs text-slate-500">RUC: 1792834921001 • Matriz: Av. Principal 450</p>
            <p className="text-xs text-slate-500">WhatsApp: +593 98 765 4321</p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
            <div className="inline-block bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-xl text-xs font-mono font-bold">
              FACTURA #{invoice.invoiceNumber}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              <span className="font-semibold text-slate-700">Fecha:</span> {formatDate(invoice.issuedAt)}
            </p>
            <div className="mt-1 flex items-center justify-end space-x-1 text-xs">
              <span className="font-semibold text-slate-700">Estado:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 capitalize">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Client info */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
          <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[10px]">
            Datos del Cliente / Destinatario
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500 font-medium">Cliente:</span>{' '}
              <span className="font-bold text-slate-800">{invoice.clientName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Establecimiento:</span>{' '}
              <span className="font-bold text-slate-800">{invoice.businessName || 'Local Registrado'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">WhatsApp:</span>{' '}
              <span className="font-mono text-slate-800">{invoice.clientWhatsapp}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Dirección:</span>{' '}
              <span className="text-slate-800">{invoice.clientAddress || 'En local'}</span>
            </div>
          </div>
        </div>

        {/* Table of items */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-2.5 px-3 rounded-l-xl">Descripción de Bebida</th>
                <th className="py-2.5 px-3">Formato / Envase</th>
                <th className="py-2.5 px-3">Detalle de Sabores</th>
                <th className="py-2.5 px-3 text-center">Javas</th>
                <th className="py-2.5 px-3 text-right">P. Java</th>
                <th className="py-2.5 px-3 text-right rounded-r-xl">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-bold text-slate-900">{item.beverageType}</td>
                  <td className="py-3 px-3 text-slate-600">
                    {item.size} ({item.container})
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {item.flavorType === 'single' ? (
                      <span>{item.selectedFlavor} (Java completa)</span>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="font-bold text-blue-700">Surtido:</span>
                        <div className="text-[11px] text-slate-500">
                          {item.surtidoDetails &&
                            Object.entries(item.surtidoDetails)
                              .map(([fl, q]) => `${q}x ${fl}`)
                              .join(', ')}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-black text-slate-900">
                    {item.quantityJavas}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatCurrency(item.pricePerJava)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & QR verification */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <QRCodeSVG
              value={`https://distribuidoraneth.com/factura/${invoice.invoiceNumber}`}
              size={64}
              level="M"
            />
            <div className="text-[10px] text-slate-500 max-w-[200px]">
              <p className="font-bold text-slate-700">Comprobante Válido</p>
              <p>Verificación directa en los servidores de Distribuidora Aneth.</p>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total de Javas:</span>
              <span className="font-mono font-bold text-slate-900">{invoice.totalJavas} javas</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA (0% / Exento):</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
              <span>TOTAL A PAGAR:</span>
              <span className="text-blue-700 font-mono">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
          Gracias por su compra. Distribuidora Aneth • Pedidos y Soporte:{' '}
          <span className="font-semibold text-slate-600">+593 98 765 4321</span>.
        </div>
      </div>
    </div>
  );
}
