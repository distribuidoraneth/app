'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

interface LiquidMobileTabPillProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  layoutId?: string;
  className?: string;
}

/**
 * Píldora de Navegación y Selector de Pestañas (Liquid Material Design)
 * Física de resorte Framer Motion con pastilla blanca flotante y expansión líquida de texto.
 */
export const LiquidMobileTabPill: React.FC<LiquidMobileTabPillProps> = ({
  tabs,
  activeTab,
  onChange,
  layoutId = 'liquid-tab-pill',
  className = '',
}) => {
  return (
    <div className={`flex justify-center w-full my-2.5 px-2 ${className}`}>
      {/* Contenedor Track Gris Vidriado */}
      <div
        role="tablist"
        className="flex items-center gap-1 p-1.5 bg-slate-200/80 border border-white/90 backdrop-blur-2xl rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] w-max max-w-full overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`relative z-10 flex items-center py-2 px-3 sm:px-3.5 rounded-full transition-colors duration-200 shrink-0 outline-none select-none cursor-pointer ${
                isActive
                  ? 'text-blue-700 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              {/* Pastilla Blanca Flotante con Spring Layout */}
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className="absolute inset-0 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-200/80 rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              {/* Ícono */}
              {tab.icon && (
                <span className="text-[18px] sm:text-[20px] shrink-0 relative z-10 flex items-center justify-center">
                  {tab.icon}
                </span>
              )}

              {/* Texto con Apertura Líquida */}
              <span
                className={`text-xs sm:text-sm font-black tracking-tight relative z-10 whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
                  isActive
                    ? 'max-w-[140px] opacity-100 ml-1.5'
                    : 'max-w-0 opacity-0 ml-0'
                }`}
              >
                {tab.label}
              </span>

              {/* Badge Contador Opcional */}
              {tab.badge !== undefined && (
                <span
                  className={`relative z-10 text-xs font-black px-2 py-0.5 min-w-[18px] text-center rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 ml-1.5'
                      : 'bg-slate-300/80 text-slate-700 ml-1'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
