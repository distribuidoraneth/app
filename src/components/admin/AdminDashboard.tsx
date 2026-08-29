'use client';

import React, { useState } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { OrderDispatchBoard } from './OrderDispatchBoard';
import { CatalogManager } from './CatalogManager';
import { ClientRegistrationModal } from './ClientRegistrationModal';
import { QRCodeModal } from './QRCodeModal';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { VectorMap } from '@/components/maps/VectorMap';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Client, Invoice } from '@/types';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import Link from 'next/link';
import {
  Building2,
  Users,
  ShoppingBag,
  FileText,
  DollarSign,
  Plus,
  QrCode,
  MapPin,
  Phone,
  Store,
  Eye,
  Truck,
  Package,
  Layers,
  ArrowRight,
  Download,
  CheckCircle2,
} from 'lucide-react';

export function AdminDashboard() {
  const { clients, orders, invoices, catalog } = useDistribution();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'clients' | 'catalog' | 'invoices'>('dispatch');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [selectedQRClient, setSelectedQRClient] = useState<Client | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Metrics
  const totalSales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalJavasSold = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalJavas, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  // Prepare map markers
  const clientMarkers = clients.map((c) => ({
    id: c.id,
    latitude: c.latitude,
    longitude: c.longitude,
    title: c.businessName || c.fullName,
    subtitle: c.whatsappNumber,
    color: 'blue-600',
  }));

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-slate-900">
      {/* Top Header - Clean Light Surface */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUIDORA" />
            <div className="hidden sm:block pl-4 border-l border-slate-200">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                Panel de Ventas & Despacho
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/"
              className="text-xs text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-bold"
            >
              Cambiar Portal
            </Link>

            <Link
              href="/pedido"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-extrabold border border-slate-300 flex items-center space-x-1.5 transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>Tomar Pedido</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Cliente QR</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Metrics - Clean Light Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Ventas Totales
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              {formatCurrency(totalSales)}
            </div>
            <p className="text-xs text-emerald-700 font-bold">
              {totalJavasSold} javas despachadas
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Por Despachar
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              {pendingOrders.length}
            </div>
            <p className="text-xs text-amber-700 font-bold">
              {deliveredOrders.length} pedidos entregados
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Establecimientos QR
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              {clients.length}
            </div>
            <p className="text-xs text-blue-700 font-bold">
              Locales comerciales activos
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Facturas Emitidas
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              {invoices.length}
            </div>
            <p className="text-xs text-indigo-700 font-bold">
              Comprobantes generados
            </p>
          </div>
        </div>

        {/* Tab Navigation - Clean Tactile Pills */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('dispatch')}
            className={`flex-1 py-3 px-5 rounded-xl text-sm font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'dispatch'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tablero de Despachos ({pendingOrders.length} pendientes)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`flex-1 py-3 px-5 rounded-xl text-sm font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'clients'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Directorio de Locales QR ({clients.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-3 px-5 rounded-xl text-sm font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Módulo de Facturación ({invoices.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-3 px-5 rounded-xl text-sm font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inventario & Stock de Javas
          </button>
        </div>

        {/* TAB 1: DESPACHOS */}
        {activeTab === 'dispatch' && <OrderDispatchBoard />}

        {/* TAB 2: CLIENTES / LOCALES QR */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Directorio de Locales y Códigos QR
                </h2>
                <p className="text-xs text-slate-500">
                  Cada establecimiento cuenta con su propio enlace permanente para realizar pedidos de javas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-xs flex items-center space-x-1.5 transition-all self-start sm:self-auto active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Nuevo Local</span>
              </button>
            </div>

            {/* Map Preview of Clients */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-red-600" />
                  Mapa de Distribución y Cobertura de Locales
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {clients.length} puntos de entrega geolocalizados
                </span>
              </div>
              <VectorMap
                markers={clientMarkers}
                latitude={-0.180653}
                longitude={-78.467834}
                zoom={12}
                className="h-72 w-full rounded-2xl"
              />
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider block">
                          Local Registrado
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                          {c.businessName || c.fullName}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedQRClient(c)}
                        className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
                        title="Ver Código QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <p className="flex items-center font-medium">
                        <Users className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {c.fullName}
                      </p>
                      <p className="flex items-center font-mono">
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {c.whatsappNumber}
                      </p>
                      <p className="flex items-start text-slate-500">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>{c.addressReference}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedQRClient(c)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Ver QR</span>
                    </button>

                    <Link
                      href={`/p/${c.qrToken}`}
                      target="_blank"
                      className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1 transition-colors"
                    >
                      <span>Abrir Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FACTURACIÓN */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Módulo de Facturación Electrónica
                </h2>
                <p className="text-xs text-slate-500">
                  Registro de facturas emitidas por pedidos despachados con opción de impresión y envío digital.
                </p>
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-extrabold text-slate-800 text-base">No hay facturas emitidas aún</h3>
                <p className="text-xs text-slate-500">
                  Las facturas se generarán automáticamente al marcar los pedidos como despachados.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3.5 px-4">Nº Factura</th>
                        <th className="py-3.5 px-4">Fecha de Emisión</th>
                        <th className="py-3.5 px-4">Establecimiento / Cliente</th>
                        <th className="py-3.5 px-4">Javas Facturadas</th>
                        <th className="py-3.5 px-4">Total</th>
                        <th className="py-3.5 px-4">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-4 font-mono font-extrabold text-blue-700 text-sm">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {formatDate(inv.issuedAt)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-slate-900 block">
                              {inv.businessName || inv.clientName}
                            </span>
                            <span className="text-slate-500 text-xs">{inv.clientName}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">
                            {inv.totalJavas} javas
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">
                            {formatCurrency(inv.total)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 capitalize">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(inv)}
                              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-xl transition-colors inline-flex items-center space-x-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Ver Factura</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CATÁLOGO & INVENTARIO */}
        {activeTab === 'catalog' && <CatalogManager />}
      </div>

      {/* Registration Modal */}
      <ClientRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onClientCreated={(newCli) => {
          setSelectedQRClient(newCli);
        }}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        client={selectedQRClient}
        isOpen={!!selectedQRClient}
        onClose={() => setSelectedQRClient(null)}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
