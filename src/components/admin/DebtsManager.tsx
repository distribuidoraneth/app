'use client';

import React, { useState } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { formatCurrency } from '@/lib/utils/formatters';
import { AppleCreditCardIcon, AppleStorefrontIcon } from '@/components/ui/AppleIcons';
import { Search, X } from 'lucide-react';

export function DebtsManager() {
  const { clients, recordDebtPayment } = useDistribution();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Métricas de Deuda
  const clientsWithDebt = clients.filter((c) => (c.currentDebt || 0) > 0);
  const totalDebt = clients.reduce((sum, c) => sum + (c.currentDebt || 0), 0);

  const filteredClients = clients.filter((client) => {
    const debt = client.currentDebt || 0;
    // Si no hay búsqueda, mostrar únicamente comercios con deuda pendiente
    if (!searchQuery.trim()) {
      return debt > 0;
    }

    // Si hay búsqueda, permitir buscar cualquier comercio por nombre, contacto o teléfono
    const q = searchQuery.toLowerCase().trim();
    const matchBusiness = (client.businessName || '').toLowerCase().includes(q);
    const matchName = (client.fullName || '').toLowerCase().includes(q);
    const matchPhone = (client.whatsappNumber || '').includes(q);
    return matchBusiness || matchName || matchPhone;
  });

  const handleRegisterPayment = (clientId: string, clientName: string, currentDebt: number) => {
    const amountStr = prompt(
      `Registrar abono de deuda para ${clientName}.\nDeuda actual: $${currentDebt.toFixed(2)}\n\nIngrese el monto abonado:`,
      currentDebt.toString()
    );
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        recordDebtPayment(clientId, amount, 'cash', 'Abono registrado en panel');
        alert(`Abono de $${amount.toFixed(2)} registrado con éxito.`);
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Tarjetas Resumen de Cartera y Cobranzas (2 Columnas Equilibradas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total por Cobrar
            </span>
            <AppleCreditCardIcon className="w-5 h-5 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-600">
            {formatCurrency(totalDebt)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Deuda acumulada en ruta</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Locales por Cobrar
            </span>
            <AppleStorefrontIcon size={20} className="text-slate-700" alt="Locales" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">
            {clientsWithDebt.length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {clientsWithDebt.length === 1
              ? '1 comercio con saldo pendiente'
              : `${clientsWithDebt.length} comercios con saldo pendiente`}
          </span>
        </div>
      </div>

      {/* Cabecera y Buscador Simple (Estilo Clientes) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-blue-600">
              Deudas
            </h1>
          </div>
        </div>

        {/* Buscador Simple */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por comercio, contacto o teléfono..."
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
          {filteredClients.length > 0 && (
            <span className="text-xs text-slate-500 font-bold shrink-0 px-2">
              {filteredClients.length} {filteredClients.length === 1 ? 'local' : 'locales'}
            </span>
          )}
        </div>
      </div>

      {/* Tabla de Deudas */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                <th className="py-3.5 px-4">Cliente / Local</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4 text-right">Deuda Pendiente</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-600 text-sm">
                        {searchQuery ? 'No se encontraron comercios' : 'Toda la cartera está al día'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {searchQuery
                          ? 'Intenta con otro término de búsqueda.'
                          : 'No existen locales con deudas pendientes registradas.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const debt = client.currentDebt || 0;

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-black text-slate-900">{client.businessName || client.fullName}</p>
                        {client.businessName && client.businessName.trim().toLowerCase() !== client.fullName.trim().toLowerCase() && (
                          <p className="text-xs text-slate-500">{client.fullName}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {client.whatsappNumber}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-rose-600 text-base sm:text-lg">
                        ${debt.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {debt > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleRegisterPayment(
                                client.id,
                                client.businessName || client.fullName,
                                debt
                              )
                            }
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-xs cursor-pointer"
                          >
                            Registrar Abono
                          </button>
                        ) : (
                          <span className="inline-block px-2.5 py-1 text-xs text-emerald-700 font-bold bg-emerald-50 rounded-lg border border-emerald-200">
                            Al día
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
