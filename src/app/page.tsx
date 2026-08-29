'use client';

import React, { useState } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { MobileTestButton } from '@/components/ui/MobileTestQRModal';
import Link from 'next/link';
import {
  QrCode,
  Building2,
  ArrowRight,
  Store,
  MapPin,
  CheckCircle2,
  Package,
} from 'lucide-react';

export default function EntryHubPage() {
  const { clients, orders, invoices } = useDistribution();
  const [selectedClientToken, setSelectedClientToken] = useState<string>(
    clients[0]?.qrToken || 'aneth-carlos-mendoza-01'
  );

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUIDORA" />

          <div className="flex items-center space-x-2.5">
            <MobileTestButton />
            <span className="hidden sm:inline-block text-xs font-extrabold text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
              Plataforma Mayorista
            </span>
          </div>
        </div>
      </header>

      {/* Main Selection Area */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="inline-block text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
            Selecciona tu portal de acceso
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Plataforma Operativa de Distribución
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Acceso directo al portal de pedidos por código QR para clientes o al panel administrativo de ventas y facturación.
          </p>
        </div>

        {/* 2 Main Primary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
          {/* 1. EXPERIENCIA DEL CLIENTE */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <QrCode className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-700">
                  Ruta: /p/[token]
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  1. Portal del Cliente • Escaneo QR
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Portal rápido para locales y restaurantes. Realiza pedidos de javas en 3 toques, personaliza javas surtidas y consulta facturas emitidas.
                </p>
              </div>

              {/* Client simulator picker */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                <label className="text-xs font-extrabold text-slate-700 flex items-center">
                  <Store className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Simular QR de:
                </label>
                {clients.length > 0 ? (
                  <select
                    value={selectedClientToken}
                    onChange={(e) => setSelectedClientToken(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.qrToken}>
                        {c.fullName} • {c.businessName || 'Local'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    Aún no hay clientes registrados. Puedes registrar uno en el Panel de Administración o probar con el token de acceso directo.
                  </p>
                )}
              </div>
            </div>

            <Link
              href={`/p/${selectedClientToken}`}
              className="w-full py-4 px-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black shadow-xs flex items-center justify-center space-x-2 transition-all"
            >
              <span>Entrar al Portal del Cliente</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 2. PANEL DE VENTAS Y FACTURACIÓN */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200">
                <Building2 className="w-7 h-7 text-blue-600" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Ruta: /admin
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  2. Panel de Ventas & Despacho
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Centro de control: Despacho de pedidos, emisión de facturas electrónicas, contacto por WhatsApp y directorio de locales con códigos QR imprimibles.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Pedidos por despachar:</span>
                  <span className="font-extrabold text-amber-600 font-mono text-sm">{pendingOrdersCount} pendientes</span>
                </div>
                <div className="flex justify-between">
                  <span>Locales QR registrados:</span>
                  <span className="font-extrabold text-slate-900 font-mono text-sm">{clients.length} locales</span>
                </div>
                <div className="flex justify-between">
                  <span>Facturas emitidas:</span>
                  <span className="font-extrabold text-blue-600 font-mono text-sm">{invoices.length}</span>
                </div>
              </div>
            </div>

            <Link
              href="/admin"
              className="w-full py-4 px-5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black shadow-xs flex items-center justify-center space-x-2 transition-all"
            >
              <span>Abrir Panel de Ventas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
        Distribuidora Aneth • Sistema de Gestión de Pedidos en Javas y Facturación
      </footer>
    </div>
  );
}
