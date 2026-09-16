'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDistribution } from '@/context/DistributionContext';
import { Invoice } from '@/types';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { FileText, Search, X, Receipt, CheckCircle2 } from 'lucide-react';

export function InvoicesManager() {
  const { invoices } = useDistribution();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchNumber = (inv.invoiceNumber || '').toLowerCase().includes(q);
    const matchClient = (inv.clientName || '').toLowerCase().includes(q);
    const matchTax = (inv.clientTaxId || '').includes(q);
    return matchNumber || matchClient || matchTax;
  });

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Cabecera y Buscador */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center space-x-2">
              <Receipt className="w-6 h-6 text-blue-600" />
              <span>Comprobantes Electrónicos SRI</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Emisión oficial de facturas con clave de acceso, firma digital y generación de RIDE PDF.
            </p>
          </div>
          <span className="text-xs font-black bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl self-start sm:self-auto border border-blue-200">
            {invoices.length} Factura{invoices.length !== 1 ? 's' : ''} emitidas
          </span>
        </div>

        {/* Buscador de Facturas */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por número de factura (ej. 001-001-...), cliente o RUC..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                <th className="py-3.5 px-4">No. Factura</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Fecha Emisión</th>
                <th className="py-3.5 px-4 text-right">Subtotal</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Estado SRI</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-600">No hay facturas registradas</p>
                    <p className="text-xs text-slate-400">Las facturas se generan automáticamente al despachar pedidos.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-blue-700">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{inv.clientName}</p>
                      {inv.clientTaxId && (
                        <p className="text-xs text-slate-400 font-mono">RUC: {inv.clientTaxId}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {formatDate(inv.issuedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(inv.subtotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        AUTORIZADA SRI
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Ver RIDE
                        </button>
                        <Link
                          href={`/factura/${inv.invoiceNumber}`}
                          target="_blank"
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 rounded-lg text-xs font-bold transition-all"
                        >
                          Portal ↗
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
