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

  // Estados para pruebas de secuencia ante el SRI
  const [showSequenceTester, setShowSequenceTester] = useState<boolean>(false);
  const [testSequence, setTestSequence] = useState<number>(1);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    esValidoYDisponible?: boolean;
    yaRegistrado?: boolean;
    claveAcceso?: string;
    mensaje?: string;
  } | null>(null);

  const handleTestSequence = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/sri/probar-secuencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secuencial: testSequence,
          ambiente: '1', // Pruebas
        }),
      });
      const data = await res.json();
      if (data.result) {
        setTestResult({
          success: true,
          esValidoYDisponible: data.result.esValidoYDisponible,
          yaRegistrado: data.result.yaRegistrado,
          claveAcceso: data.result.claveAcceso,
          mensaje: data.result.esValidoYDisponible
            ? `Secuencial #${testSequence} DISPONIBLE y aceptado en el SRI (Ambiente de Pruebas).`
            : data.result.yaRegistrado
            ? `Secuencial #${testSequence} YA REGISTRADO en el SRI. Prueba con un número mayor.`
            : `Respuesta del SRI: ${data.result.recepcion?.estado || 'Error en validación'}.`,
        });
      } else {
        setTestResult({
          success: false,
          mensaje: data.error || 'Error de conexión con el WebService del SRI',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        mensaje: err?.message || 'Error al conectar con la API de pruebas SRI',
      });
    } finally {
      setIsTesting(false);
    }
  };

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
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center space-x-2">
                <Receipt className="w-6 h-6 text-blue-600" />
                <span>Comprobantes Electrónicos SRI</span>
              </h2>
              <span className="text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                Ambiente: Pruebas
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Facturación automática al despachar • Anulación legal mediante Nota de Crédito (Doc 04).
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowSequenceTester(!showSequenceTester)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            >
              {showSequenceTester ? 'Ocultar Pruebas SRI' : '🔍 Probar Secuencias SRI'}
            </button>
            <span className="text-xs font-black bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200">
              {invoices.length} Factura{invoices.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Panel de Pruebas de Secuencia SRI */}
        {showSequenceTester && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center">
                🧪 Validador de Secuencial en Vivo (celcer.sri.gob.ec)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Punto: 001-001 | RUC: 1803013810001
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Envía un XML de prueba firmado a los servidores del SRI para verificar qué número de secuencia está disponible.
            </p>

            <div className="flex items-center gap-2 max-w-md">
              <div className="flex-1 flex items-center bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-600 shadow-2xs">
                <span className="text-xs font-mono text-slate-400 mr-2">001-001-</span>
                <input
                  type="number"
                  min="1"
                  value={testSequence}
                  onChange={(e) => setTestSequence(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={handleTestSequence}
                disabled={isTesting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isTesting ? 'Validando...' : 'Probar en SRI'}
              </button>

              <button
                type="button"
                onClick={() => setTestSequence((prev) => prev + 1)}
                className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                title="Siguiente secuencial (+1)"
              >
                +1
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium ${
                  testResult.esValidoYDisponible
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : testResult.yaRegistrado
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <p className="font-bold">{testResult.mensaje}</p>
                {testResult.claveAcceso && (
                  <p className="text-[10px] font-mono text-slate-500 mt-1 break-all">
                    Clave generada: {testResult.claveAcceso}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

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
                      {inv.status === 'anulada' ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                            ANULADA
                          </span>
                          {inv.creditNoteNumber && (
                            <span className="text-[10px] font-mono text-slate-500">
                              NC: {inv.creditNoteNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          AUTORIZADA SRI
                        </span>
                      )}
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
