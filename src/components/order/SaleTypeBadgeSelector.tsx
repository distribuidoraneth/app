'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Calendar } from 'lucide-react';
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
    <div className={`w-full ${className}`}>
      {/* Clean Segmented Controller */}
      <div className="bg-slate-100 p-1 rounded-2xl flex items-center relative border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => onChange('autoventa')}
          className={`flex-1 relative z-10 py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 text-xs sm:text-sm font-black transition-colors cursor-pointer ${
            value === 'autoventa' ? 'text-blue-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {value === 'autoventa' && (
            <motion.div
              layoutId="sale-type-pill"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200 -z-10"
            />
          )}
          <Zap className={`w-4 h-4 ${value === 'autoventa' ? 'text-blue-600 fill-blue-600' : 'text-slate-400'}`} />
          <span>Autoventa</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('preventa')}
          className={`flex-1 relative z-10 py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 text-xs sm:text-sm font-black transition-colors cursor-pointer ${
            value === 'preventa' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {value === 'preventa' && (
            <motion.div
              layoutId="sale-type-pill"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200 -z-10"
            />
          )}
          <Calendar className={`w-4 h-4 ${value === 'preventa' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>Preventa</span>
        </button>
      </div>
    </div>
  );
}
