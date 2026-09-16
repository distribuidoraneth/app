'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDistribution } from '@/context/DistributionContext';
import { supabase } from '@/lib/supabase/client';
import { OrderDispatchBoard } from './OrderDispatchBoard';
import { CatalogManager } from './CatalogManager';
import { ClientRegistrationModal } from './ClientRegistrationModal';
import { QRCodeModal } from './QRCodeModal';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { LiquidMobileTabPill, TabItem } from '@/components/ui/LiquidMobileTabPill';
import { MobileFloatingDock, DockNavItem } from '@/components/ui/MobileFloatingDock';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Client, Invoice } from '@/types';
import { AnethFullLogo, AnethIsotype } from '@/components/ui/AnethLogo';
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
  LogOut,
  CreditCard,
  AlertTriangle,
  Receipt,
  Sparkles,
  Zap,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import {
  AppleGaugeDollarIcon,
  AppleShippingBoxIcon,
  ApplePersonsIcon,
  AppleCreditCardIcon,
  AppleCalendarClockIcon,
  AppleTruckBoxIcon,
  AppleReceiptIcon,
} from '@/components/ui/AppleIcons';

export function AdminDashboard() {
  const router = useRouter();
  const { clients, orders, invoices, catalog, recordDebtPayment } = useDistribution();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'clients' | 'debts' | 'invoices' | 'catalog'>('dispatch');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [selectedQRClient, setSelectedQRClient] = useState<Client | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    avatarUrl?: string;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          (user.email ? user.email.split('@')[0] : 'Administrador');
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        setUserProfile({
          name,
          email: user.email || '',
          avatarUrl,
        });
      }
    });
  }, []);

  // Metrics
  const totalSales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalJavasSold = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalJavas, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const totalDebt = clients.reduce((sum, c) => sum + (c.currentDebt || 0), 0);

  // Prepare map markers
  const clientMarkers = clients.map((c) => ({
    id: c.id,
    latitude: c.latitude,
    longitude: c.longitude,
    title: c.businessName || c.fullName,
    subtitle: c.whatsappNumber,
    color: 'blue-600',
  }));

  const handleLogout = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('aneth_admin_authenticated');
    sessionStorage.removeItem('aneth_admin_authenticated');
    router.push('/');
  };

  // Tab definitions for Liquid Pill and Dock
  const tabsList: TabItem[] = [
    {
      id: 'dispatch',
      label: 'Despachos',
      icon: <AppleTruckBoxIcon className="w-4 h-4" />,
      badge: pendingOrders.length > 0 ? pendingOrders.length : undefined,
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: <ApplePersonsIcon className="w-4 h-4" />,
      badge: clients.length,
    },
    {
      id: 'debts',
      label: 'Deudas',
      icon: <AppleCreditCardIcon className="w-4 h-4" />,
      badge: totalDebt > 0 ? `$${Math.round(totalDebt)}` : undefined,
    },
    {
      id: 'invoices',
      label: 'Facturación',
      icon: <AppleReceiptIcon className="w-4 h-4" />,
      badge: invoices.length,
    },
    {
      id: 'catalog',
      label: 'Inventario',
      icon: <Layers className="w-4 h-4" />,
    },
  ];

  const dockNavItems: DockNavItem[] = [
    {
      id: 'dispatch',
      label: 'Pedidos',
      icon: <AppleTruckBoxIcon className="w-5 h-5" />,
      badge: pendingOrders.length > 0 ? pendingOrders.length : undefined,
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: <ApplePersonsIcon className="w-5 h-5" />,
    },
    {
      id: 'debts',
      label: 'Deudas',
      icon: <AppleCreditCardIcon className="w-5 h-5" />,
    },
    {
      id: 'invoices',
      label: 'Facturas',
      icon: <AppleReceiptIcon className="w-5 h-5" />,
    },
    {
      id: 'catalog',
      label: 'Stock',
      icon: <Layers className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-28 text-slate-900">
      {/* Top Header - Clean Light Surface */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden sm:block">
              <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUCIONES" />
            </div>
            <div className="sm:hidden">
              <AnethIsotype size="md" variant="color" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/pedido?type=autoventa"
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-[11px] sm:text-xs font-black shadow-xs flex items-center space-x-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
              <span>Autoventa</span>
            </Link>

            <Link
              href="/pedido?type=preventa"
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl text-[11px] sm:text-xs font-black border border-slate-200/80 flex items-center space-x-1.5 transition-colors"
            >
              <AppleCalendarClockIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Preventa</span>
            </Link>

            {/* Google User Profile Chip */}
            {userProfile && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-8 h-8 rounded-full border border-slate-200 shadow-2xs object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    {userProfile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <span className="text-xs font-black text-slate-900 block leading-tight truncate max-w-[130px]">
                    {userProfile.name}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold block leading-none">
                    Admin Activo
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3.5 sm:py-5 space-y-4 sm:space-y-5">
        {/* Apple Minimalist KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ventas
              </span>
              <AppleGaugeDollarIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 text-lg sm:text-2xl font-black font-mono tracking-tight text-slate-900">
              {formatCurrency(totalSales)}
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Por Despachar
              </span>
              <AppleShippingBoxIcon className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-1 text-lg sm:text-2xl font-black font-mono tracking-tight text-slate-900">
              {pendingOrders.length}
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Clientes
              </span>
              <ApplePersonsIcon className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-1 text-lg sm:text-2xl font-black font-mono tracking-tight text-slate-900">
              {clients.length}
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Por Cobrar
              </span>
              <AppleCreditCardIcon className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-1 text-lg sm:text-2xl font-black font-mono tracking-tight text-slate-900">
              {formatCurrency(totalDebt)}
            </div>
          </div>
        </div>

        {/* Liquid Material Tab Pill Selector */}
        <div className="hidden md:flex justify-center w-full">
          <LiquidMobileTabPill
            tabs={tabsList}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            layoutId="admin-desktop-tabs"
          />
        </div>

        {/* TAB 1: TABLERO DE DESPACHOS */}
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
                  Genera credenciales QR impresas para cada local comercial. Los clientes escanean y piden directamente.
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

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {client.gender}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 mt-1">
                          {client.businessName || client.fullName}
                        </h3>
                        <p className="text-xs text-slate-500">{client.fullName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedQRClient(client)}
                        className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition-colors"
                        title="Ver Código QR"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 pt-1">
                      <p className="flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span className="font-mono">{client.whatsappNumber}</span>
                      </p>
                      {client.taxId && (
                        <p className="text-[11px] text-slate-500 font-mono">
                          RUC/CI: {client.taxId} ({client.taxIdType === '04' ? 'RUC' : 'Cédula'})
                        </p>
                      )}
                      <div className="flex items-start justify-between text-slate-500 text-[11px] pt-0.5">
                        <p className="flex items-start">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0 mt-0.5" />
                          <span>{client.addressReference || 'Sin dirección registrada'}</span>
                        </p>
                        {typeof client.latitude === 'number' && typeof client.longitude === 'number' && !isNaN(client.latitude) && !isNaN(client.longitude) && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${client.latitude},${client.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold shrink-0 ml-1.5 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="Abrir ubicación en Google Maps"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Credit Status */}
                    {(client.creditLimit || 0) > 0 && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Cupo Crédito</span>
                          <span className="font-bold font-mono text-slate-800">${client.creditLimit || 0}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Deuda Actual</span>
                          <span className={`font-bold font-mono ${(client.currentDebt || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            ${(client.currentDebt || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedQRClient(client)}
                      className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <span>Imprimir Sticker QR</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <Link
                      href={`/p/${client.qrToken}`}
                      target="_blank"
                      className="text-xs text-slate-500 hover:text-slate-900 font-medium"
                    >
                      Abrir Portal ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUENTAS POR COBRAR Y DEUDAS */}
        {activeTab === 'debts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Control de Créditos y Cuentas por Cobrar
                </h2>
                <p className="text-xs text-slate-500">
                  Monitoreo de deudas pendientes por cliente, límites autorizados y registro de abonos en efectivo/transferencia.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Cliente / Local</th>
                      <th className="py-3 px-4">Contacto</th>
                      <th className="py-3 px-4 text-right">Cupo Asignado</th>
                      <th className="py-3 px-4 text-right">Deuda Actual</th>
                      <th className="py-3 px-4 text-right">Disponible</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No hay clientes registrados aún.
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => {
                        const debt = client.currentDebt || 0;
                        const available = Math.max(0, (client.creditLimit || 0) - debt);

                        return (
                          <tr key={client.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <p className="font-extrabold text-slate-900">{client.businessName || client.fullName}</p>
                              <p className="text-[11px] text-slate-500">{client.fullName}</p>
                            </td>
                            <td className="py-3 px-4 font-mono">{client.whatsappNumber}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold">
                              ${(client.creditLimit || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-extrabold text-amber-600">
                              ${debt.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                              ${available.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {debt > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const amountStr = prompt(`Registrar abono para ${client.fullName}.\nDeuda actual: $${debt.toFixed(2)}\n\nIngrese monto a abonar:`, debt.toString());
                                    if (amountStr) {
                                      const amount = parseFloat(amountStr);
                                      if (amount > 0) {
                                        recordDebtPayment(client.id, amount, 'cash', 'Abono registrado en panel');
                                        alert(`Abono de $${amount.toFixed(2)} registrado con éxito.`);
                                      }
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                                >
                                  Registrar Abono
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
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
        )}

        {/* TAB 4: FACTURACIÓN SRI */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Comprobantes Electrónicos SRI
                </h2>
                <p className="text-xs text-slate-500">
                  Emisión de facturas con firma digital XAdES-BES y generación de RIDE PDF oficial.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">No. Factura</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Fecha Emisión</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-center">Estado SRI</th>
                      <th className="py-3 px-4 text-center">Portal Web</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Aún no se han emitido facturas electrónicas.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{inv.clientName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{inv.clientTaxId || 'Consumidor Final'}</p>
                          </td>
                          <td className="py-3 px-4">{formatDate(inv.issuedAt)}</td>
                          <td className="py-3 px-4 text-right font-mono font-medium">
                            {formatCurrency(inv.subtotal)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                            {formatCurrency(inv.total)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              AUTORIZADA SRI
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(inv)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                              >
                                Ver RIDE
                              </button>
                              <Link
                                href={`/factura/${inv.invoiceNumber}`}
                                target="_blank"
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                              >
                                Portal ↗
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CATÁLOGO & INVENTARIO */}
        {activeTab === 'catalog' && <CatalogManager />}
      </div>

      {/* Mobile Floating Bottom Dock (Liquid Material) */}
      <div className="md:hidden">
        <MobileFloatingDock
          items={dockNavItems}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          layoutId="mobile-admin-dock"
        />
      </div>

      {/* Modals */}
      <ClientRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onClientCreated={(client) => {
          setSelectedQRClient(client);
        }}
      />

      <QRCodeModal
        client={selectedQRClient}
        isOpen={!!selectedQRClient}
        onClose={() => setSelectedQRClient(null)}
      />

      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
