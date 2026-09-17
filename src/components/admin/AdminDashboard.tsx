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
import { formatCurrency, formatDate, cleanAddress } from '@/lib/utils/formatters';
import { Client, Invoice } from '@/types';
import { AnethFullLogo, AnethIsotype } from '@/components/ui/AnethLogo';
import { AppleMapPinIcon } from '@/components/ui/AppleIcons';
import Link from 'next/link';
import {
  Building2,
  Users,
  ShoppingBag,
  FileText,
  DollarSign,
  Plus,
  Pencil,
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
  AppleSquareStackIcon,
  AppleQrCodeIcon,
  ApplePencilIcon,
  ApplePhoneIcon,
  AppleTrashIcon,
  AppleWhatsAppIcon,
} from '@/components/ui/AppleIcons';

export function AdminDashboard() {
  const router = useRouter();
  const { clients, orders, invoices, catalog, recordDebtPayment, deleteClient } = useDistribution();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'clients' | 'debts' | 'invoices' | 'catalog'>('dispatch');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState<boolean>(false);
  const [deleteClientError, setDeleteClientError] = useState<string | null>(null);
  const [selectedQRClient, setSelectedQRClient] = useState<Client | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    avatarUrl?: string;
  } | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);

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

  // Tab definitions for Liquid Pill and Dock (Minimalist, without distracting badge numbers)
  const tabsList: TabItem[] = [
    {
      id: 'dispatch',
      label: 'Despachos',
      icon: <AppleTruckBoxIcon className="w-4 h-4" />,
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: <ApplePersonsIcon className="w-4 h-4" />,
    },
    {
      id: 'debts',
      label: 'Deudas',
      icon: <AppleCreditCardIcon className="w-4 h-4" />,
    },
    {
      id: 'invoices',
      label: 'Facturación',
      icon: <AppleReceiptIcon className="w-4 h-4" />,
    },
    {
      id: 'catalog',
      label: 'Inventario',
      icon: <AppleSquareStackIcon className="w-4 h-4" />,
    },
  ];

  const dockNavItems: DockNavItem[] = [
    {
      id: 'dispatch',
      label: 'Pedidos',
      icon: <AppleTruckBoxIcon className="w-5 h-5" />,
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
      icon: <AppleSquareStackIcon className="w-5 h-5" />,
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

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Link
              href="/pedido?type=autoventa"
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 min-w-[106px] sm:min-w-[124px] justify-center bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-sm sm:text-base font-black shadow-xs flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer"
            >
              <AppleTruckBoxIcon className="w-5 h-5 shrink-0" />
              <span className="leading-none">Autoventa</span>
            </Link>

            <Link
              href="/pedido?type=preventa"
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 min-w-[106px] sm:min-w-[124px] justify-center bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-sm sm:text-base font-black shadow-xs flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer"
            >
              <AppleCalendarClockIcon className="w-5 h-5 shrink-0" />
              <span className="leading-none">Preventa</span>
            </Link>

            {/* Google User Profile Chip with Dropdown for Logout */}
            <div className="relative pl-1 sm:pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 p-1 rounded-full sm:rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden"
              >
                {userProfile?.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-9 h-9 rounded-full border border-slate-200 shadow-2xs object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-2xs">
                    {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <span className="text-sm font-black text-slate-900 block leading-tight truncate max-w-[130px]">
                    {userProfile?.name || 'Administrador'}
                  </span>
                  <span className="text-xs text-emerald-600 font-bold block leading-none">
                    Admin Activo
                  </span>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-black text-slate-900 truncate">
                        {userProfile?.name || 'Administrador'}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {userProfile?.email || 'admin@aneth.com'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3.5 sm:py-5 space-y-4 sm:space-y-5">
        {/* Apple Minimalist KPI Metrics (Shown strictly on dispatch/pedidos tab) */}
        {activeTab === 'dispatch' && (
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
        )}

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
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-blue-600">
                  Clientes
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-xs flex items-center space-x-1.5 transition-all self-start sm:self-auto active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Local</span>
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
                        <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {client.gender}
                        </span>
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-1">
                          {client.businessName || client.fullName}
                        </h3>
                        {client.businessName && client.businessName.trim().toLowerCase() !== client.fullName.trim().toLowerCase() && (
                          <p className="text-xs sm:text-sm text-slate-500">{client.fullName}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingClient(client)}
                          className="p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                          title="Modificar / Editar Cliente"
                        >
                          <ApplePencilIcon size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedQRClient(client)}
                          className="p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                          title="Ver Código QR"
                        >
                          <AppleQrCodeIcon size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setClientToDelete(client)}
                          className="p-2.5 bg-slate-100 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                          title="Eliminar Cliente"
                        >
                          <AppleTrashIcon size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-600 space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-medium text-xs sm:text-sm text-slate-700">
                          {client.whatsappNumber}
                        </span>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <a
                            href={`tel:${client.whatsappNumber.replace(/\D/g, '')}`}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-bold transition-colors inline-flex items-center space-x-1 cursor-pointer active:scale-95"
                            title="Llamar directamente"
                          >
                            <ApplePhoneIcon size={13} />
                            <span>Llamar</span>
                          </a>
                          <a
                            href={`https://wa.me/${(() => {
                              const digits = client.whatsappNumber.replace(/\D/g, '');
                              if (digits.startsWith('593')) return digits;
                              if (digits.startsWith('0')) return '593' + digits.slice(1);
                              return '593' + digits;
                            })()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center space-x-1 cursor-pointer active:scale-95"
                            title="Abrir chat de WhatsApp"
                          >
                            <AppleWhatsAppIcon size={14} />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                      {client.taxId && (
                        <p className="text-xs text-slate-600 font-mono">
                          <span className="font-bold text-slate-700">
                            {client.taxId.trim().length === 13 || client.taxIdType === '04' ? 'RUC:' : 'Cédula:'}
                          </span>{' '}
                          {client.taxId}
                        </p>
                      )}
                      {cleanAddress(client.addressReference) && (
                        <div className="flex items-start justify-between text-slate-500 text-xs pt-0.5">
                          <p className="flex items-start">
                            <AppleMapPinIcon size={14} className="mr-1 opacity-60 shrink-0 mt-0.5" alt="Ubicación" />
                            <span>{cleanAddress(client.addressReference)}</span>
                          </p>
                          {typeof client.latitude === 'number' && typeof client.longitude === 'number' && !isNaN(client.latitude) && !isNaN(client.longitude) && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${client.latitude},${client.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold shrink-0 ml-1.5 p-1 rounded-md hover:bg-blue-50 transition-colors"
                              title="Abrir ubicación en Google Maps"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Saldo Pendiente */}
                    {(client.currentDebt || 0) > 0 && (
                      <div className="bg-amber-50/80 px-3.5 py-2.5 rounded-xl border border-amber-200/70 flex justify-between items-center">
                        <span className="text-xs font-semibold text-amber-800">Saldo pendiente</span>
                        <span className="font-mono font-black text-amber-700 text-sm">
                          ${(client.currentDebt || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <Link
                      href={`/p/${client.qrToken}`}
                      target="_blank"
                      className="w-full sm:w-auto px-5 py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs sm:text-sm font-black transition-all text-center flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs"
                    >
                      Abrir Portal
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
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                      <th className="py-3 px-4">Cliente / Local</th>
                      <th className="py-3 px-4">Contacto</th>
                      <th className="py-3 px-4 text-right">Deuda Pendiente</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          No hay clientes registrados aún.
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => {
                        const debt = client.currentDebt || 0;

                        return (
                          <tr key={client.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <p className="font-extrabold text-slate-900">{client.businessName || client.fullName}</p>
                              <p className="text-xs text-slate-500">{client.fullName}</p>
                            </td>
                            <td className="py-3 px-4 font-mono">{client.whatsappNumber}</td>
                            <td className="py-3 px-4 text-right font-mono font-extrabold text-amber-600">
                              ${debt.toFixed(2)}
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
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                                >
                                  Registrar Abono
                                </button>
                              ) : (
                                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
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
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
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
                            <p className="text-xs text-slate-500 font-mono">{inv.clientTaxId || 'Consumidor Final'}</p>
                          </td>
                          <td className="py-3 px-4">{formatDate(inv.issuedAt)}</td>
                          <td className="py-3 px-4 text-right font-mono font-medium">
                            {formatCurrency(inv.subtotal)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                            {formatCurrency(inv.total)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              AUTORIZADA SRI
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(inv)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
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
        isOpen={isRegisterModalOpen || !!editingClient}
        clientToEdit={editingClient}
        onClose={() => {
          setIsRegisterModalOpen(false);
          setEditingClient(null);
        }}
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

      {/* Modal de confirmación de eliminación */}
      {clientToDelete && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AppleTrashIcon size={24} />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-black text-slate-900 text-lg">
                ¿Eliminar Cliente?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Se eliminará <strong className="text-slate-800">{clientToDelete.businessName || clientToDelete.fullName}</strong>. Esta acción no se puede deshacer.
              </p>
              {deleteClientError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {deleteClientError}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingClient}
                onClick={() => {
                  setClientToDelete(null);
                  setDeleteClientError(null);
                }}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingClient}
                onClick={async () => {
                  setIsDeletingClient(true);
                  setDeleteClientError(null);
                  const ok = await deleteClient(clientToDelete.id);
                  setIsDeletingClient(false);
                  if (ok) {
                    setClientToDelete(null);
                  } else {
                    setDeleteClientError('No se pudo eliminar de la base de datos. Intente nuevamente.');
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeletingClient ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
