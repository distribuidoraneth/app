'use client';

import React from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { OrderDispatchBoard } from '@/components/admin/OrderDispatchBoard';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  AppleGaugeDollarIcon,
  AppleShippingBoxIcon,
  ApplePersonsIcon,
  AppleCreditCardIcon,
} from '@/components/ui/AppleIcons';

export default function PedidosPage() {
  const { clients, orders } = useDistribution();

  // Métricas calculadas para la vista activa de despachos
  const totalSales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const totalDebt = clients.reduce((sum, c) => sum + (c.currentDebt || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Tarjetas KPI de Despacho */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 uppercase tracking-wider">
              Ventas
            </span>
            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/70 shadow-2xs">
              <AppleGaugeDollarIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
            {formatCurrency(totalSales)}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 uppercase tracking-wider">
              Por Despachar
            </span>
            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/70 shadow-2xs">
              <AppleShippingBoxIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
            {pendingOrders.length}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 uppercase tracking-wider">
              Clientes
            </span>
            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/70 shadow-2xs">
              <ApplePersonsIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
            {clients.length}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 uppercase tracking-wider">
              Por Cobrar
            </span>
            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/70 shadow-2xs">
              <AppleCreditCardIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
            {formatCurrency(totalDebt)}
          </div>
        </div>
      </div>

      {/* Tablero de Despachos y Pedidos */}
      <OrderDispatchBoard />
    </div>
  );
}
