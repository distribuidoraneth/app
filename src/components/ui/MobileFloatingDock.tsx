'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface DockNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface MobileFloatingDockProps {
  items: DockNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  layoutId?: string;
  className?: string;
}

/**
 * Dock Flotante Móvil de Navegación (Liquid Material Design)
 * Barra inferior ergonómica con separación segura de bordes táctiles.
 */
export const MobileFloatingDock: React.FC<MobileFloatingDockProps> = ({
  items,
  activeId,
  onChange,
  layoutId = 'mobile-dock-pill',
  className = '',
}) => {
  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex justify-center w-auto max-w-[95vw] px-2 print:hidden ${className}`}
    >
      <nav
        aria-label="Navegación Móvil Aneth"
        className="pointer-events-auto flex items-center gap-1 p-1.5 liquid-glass-dock border border-white/90 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.18)] w-max max-w-full overflow-x-auto no-scrollbar"
      >
        {items.map((item) => {
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`relative z-10 flex items-center py-2.5 px-3 rounded-full transition-colors duration-200 shrink-0 outline-none select-none cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'text-blue-700 font-black'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              {/* Burbuja Activa Blanca con Física Spring */}
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className="absolute inset-0 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-200/80 rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              {/* Ícono */}
              <span className="text-[19px] shrink-0 relative z-10 flex items-center justify-center">
                {item.icon}
              </span>

              {/* Etiqueta Dinámica Líquida */}
              <span
                className={`text-xs sm:text-sm font-black tracking-tight relative z-10 whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
                  isActive
                    ? 'max-w-[120px] opacity-100 ml-1.5'
                    : 'max-w-0 opacity-0 ml-0'
                }`}
              >
                {item.label}
              </span>

              {/* Badge de Alerta o Contador */}
              {item.badge !== undefined && (
                <span
                  className={`relative z-10 text-xs font-black px-2 py-0.5 min-w-[18px] text-center rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 ml-1'
                      : 'bg-red-500 text-white ml-0.5'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
