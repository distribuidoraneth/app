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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 uppercase tracking-wider">
              Ventas
            </span>
            <AppleGaugeDollarIcon className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 text-emerald-600 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
            {formatCurrency(totalSales)}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 uppercase tracking-wider">
              Por Despachar
            </span>
            <AppleShippingBoxIcon className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 text-amber-500 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
            {pendingOrders.length}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 uppercase tracking-wider">
              Clientes
            </span>
            <ApplePersonsIcon className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 text-blue-500 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
            {clients.length}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 uppercase tracking-wider">
              Por Cobrar
            </span>
            <AppleCreditCardIcon className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 text-rose-500 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
            {formatCurrency(totalDebt)}
          </div>
        </div>
      </div>

      {/* Tablero de Despachos y Pedidos */}
      <OrderDispatchBoard />
    </div>
  );
}
