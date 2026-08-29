'use client';

import React from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { formatCurrency } from '@/lib/utils/formatters';
import { Package } from 'lucide-react';

export function CatalogManager() {
  const { catalog, updateStock } = useDistribution();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Control de Inventario y Stock de Javas</h2>
        <p className="text-xs text-slate-500">
          Existencias de javas en Colas, Aguas y Tés • Plástico y Vidrio Retornable.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-extrabold uppercase text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Bebida • Envase</th>
                <th className="py-3 px-4">Tamaño</th>
                <th className="py-3 px-4">Sabores Disponibles</th>
                <th className="py-3 px-4">Unidades por Java</th>
                <th className="py-3 px-4">Precio Java</th>
                <th className="py-3 px-4 text-center">Stock Javas</th>
                <th className="py-3 px-4 text-right">Ajustar Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {catalog.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-slate-900 text-sm">{item.beverageType}</div>
                    <span className="text-xs text-slate-500 font-medium">{item.container}</span>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-blue-700 text-sm">{item.size}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.allowedFlavors.map((fl) => (
                        <span
                          key={fl}
                          className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-700"
                        >
                          {fl}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{item.unitsPerJava} botellas</td>
                  <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">
                    {formatCurrency(item.pricePerJava)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                        item.stockJavas > 20
                          ? 'bg-emerald-100 text-emerald-900'
                          : item.stockJavas > 0
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-red-100 text-red-900'
                      }`}
                    >
                      {item.stockJavas} javas
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateStock(item.id, Math.max(0, item.stockJavas - 5))}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-extrabold shadow-2xs transition-colors"
                        title="Restar 5 javas"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStock(item.id, item.stockJavas + 10)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 text-blue-700 rounded-lg text-xs font-extrabold shadow-2xs transition-colors"
                        title="Agregar 10 javas"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStock(item.id, item.stockJavas + 50)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold shadow-2xs transition-colors"
                        title="Agregar 50 javas"
                      >
                        +50
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
