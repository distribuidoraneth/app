'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Calendar, Truck, Clock, CheckCircle2 } from 'lucide-react';
import { SaleType } from '@/types';

interface SaleTypeBadgeSelectorProps {
  value: SaleType;
  onChange: (type: SaleType) => void;
  className?: string;
}

export function SaleTypeBadgeSelector({
  value,
  onChange,
  className = '',
}: SaleTypeBadgeSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Segmented Controller */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center relative border border-slate-300/70 shadow-2xs">
        <button
          type="button"
          onClick={() => onChange('autoventa')}
          className={`flex-1 relative z-10 py-2 px-3 rounded-xl flex items-center justify-center space-x-2 text-xs sm:text-sm font-black transition-colors ${
            value === 'autoventa' ? 'text-blue-900' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {value === 'autoventa' && (
            <motion.div
              layoutId="sale-type-pill"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/90 -z-10"
            />
          )}
          <Zap className={`w-4 h-4 ${value === 'autoventa' ? 'text-blue-600 fill-blue-600' : 'text-slate-400'}`} />
          <span>⚡ Autoventa (En Ruta)</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('preventa')}
          className={`flex-1 relative z-10 py-2 px-3 rounded-xl flex items-center justify-center space-x-2 text-xs sm:text-sm font-black transition-colors ${
            value === 'preventa' ? 'text-slate-950' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {value === 'preventa' && (
            <motion.div
              layoutId="sale-type-pill"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/90 -z-10"
            />
          )}
          <Calendar className={`w-4 h-4 ${value === 'preventa' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>📅 Preventa (Programado)</span>
        </button>
      </div>

      {/* Dynamic Hint */}
      <div className="px-1 text-[11px] font-semibold text-slate-500 flex items-center space-x-1.5">
        {value === 'autoventa' ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              <strong>Venta Inmediata:</strong> El pedido queda <strong>entregado al instante</strong>, descuenta stock y emite la <strong>Factura SRI</strong> de forma automática.
            </span>
          </>
        ) : (
          <>
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>Pedido Anticipado:</strong> Se guarda en la ruta de despachos para entrega con fecha y hora asignadas.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
