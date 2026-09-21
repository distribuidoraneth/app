'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDistribution } from '@/context/DistributionContext';
import { Client } from '@/types';
import { ClientRegistrationModal } from './ClientRegistrationModal';
import { QRCodeModal } from './QRCodeModal';
import { cleanAddress } from '@/lib/utils/formatters';
import {
  AppleMapPinIcon,
  AppleQrCodeIcon,
  ApplePencilIcon,
  ApplePhoneIcon,
  AppleTrashIcon,
  AppleWhatsAppIcon,
  ApplePersonsIcon,
  ApplePersonBadgePlusIcon,
} from '@/components/ui/AppleIcons';
import {
  ArrowRight,
  ExternalLink,
  Search,
  X,
} from 'lucide-react';

export function ClientsManager() {
  const router = useRouter();
  const { clients, deleteClient } = useDistribution();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedQRClient, setSelectedQRClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredClients = clients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchBusiness = (c.businessName || '').toLowerCase().includes(q);
    const matchName = (c.fullName || '').toLowerCase().includes(q);
    const matchPhone = (c.whatsappNumber || '').includes(q);
    const matchTax = (c.taxId || '').includes(q);
    const matchAddress = (c.addressReference || '').toLowerCase().includes(q);
    return matchBusiness || matchName || matchPhone || matchTax || matchAddress;
  });

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Cabecera y Barra de Acciones */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-blue-600">
              Clientes
            </h1>
          </div>

          <Link
            href="/admin/clientes/nuevo"
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl sm:rounded-2xl text-sm sm:text-base font-black shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 flex items-center space-x-2 transition-all self-start sm:self-auto cursor-pointer"
          >
            <ApplePersonBadgePlusIcon className="w-5 h-5 sm:w-[22px] sm:h-[22px] shrink-0" alt="Nuevo Local" />
            <span className="leading-none">Nuevo Local</span>
          </Link>
        </div>

        {/* Buscador de Clientes */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por comercio, cliente, teléfono, RUC/cédula o dirección..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-slate-500 font-bold shrink-0 px-2">
            {filteredClients.length} de {clients.length}
          </span>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 space-y-2.5 px-4">
          <ApplePersonsIcon size={44} className="mx-auto opacity-30" alt="Sin clientes" />
          <p className="text-slate-800 font-black text-sm">No se encontraron clientes</p>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            {searchQuery ? 'Prueba con otro término de búsqueda.' : 'Aún no hay clientes registrados.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-2 inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Mostrar todos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => window.open(`/p/${client.qrToken}`, '_blank')}
              className="group bg-white p-5 rounded-3xl border border-slate-200/90 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-400 active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between space-y-4"
              title="Clic para abrir el Portal del Cliente"
            >
              <div className="space-y-3">
                {/* Cabecera: Nombre de negocio y acciones */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight group-hover:text-blue-600 transition-colors truncate">
                      {client.businessName || client.fullName}
                    </h3>
                    {client.businessName && client.businessName.trim().toLowerCase() !== client.fullName.trim().toLowerCase() && (
                      <p className="text-xs sm:text-sm text-slate-500 font-medium truncate mt-0.5">{client.fullName}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/clientes/nuevo?id=${client.id}`);
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition-colors cursor-pointer flex items-center justify-center active:scale-95"
                      title="Modificar / Editar Cliente"
                    >
                      <ApplePencilIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQRClient(client);
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition-colors cursor-pointer flex items-center justify-center active:scale-95"
                      title="Ver Código QR"
                    >
                      <AppleQrCodeIcon size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClientToDelete(client);
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer flex items-center justify-center active:scale-95"
                      title="Eliminar Cliente"
                    >
                      <AppleTrashIcon size={16} />
                    </button>
                  </div>
                </div>

                {/* Datos de contacto y fiscales */}
                <div className="text-xs sm:text-sm text-slate-600 space-y-2 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-800">
                      {client.whatsappNumber}
                    </span>
                    <div className="flex items-center space-x-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`tel:${client.whatsappNumber.replace(/\D/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
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

                  {/* Dirección enlazada directamente al mapa */}
                  {cleanAddress(client.addressReference) && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const mapUrl =
                          typeof client.latitude === 'number' &&
                          typeof client.longitude === 'number' &&
                          !isNaN(client.latitude) &&
                          !isNaN(client.longitude)
                            ? `https://www.google.com/maps/search/?api=1&query=${client.latitude},${client.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.addressReference)}`;
                        window.open(mapUrl, '_blank');
                      }}
                      className="flex items-start text-slate-500 hover:text-blue-600 text-xs pt-0.5 cursor-pointer group/addr transition-colors"
                      title="Abrir ubicación en Google Maps"
                    >
                      <AppleMapPinIcon size={14} className="mr-1.5 opacity-60 group-hover/addr:opacity-100 group-hover/addr:text-blue-600 shrink-0 mt-0.5 transition-colors" alt="Ubicación" />
                      <span className="group-hover/addr:underline line-clamp-2 leading-tight">
                        {cleanAddress(client.addressReference)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Saldo Pendiente (Solo si existe deuda) */}
                {(client.currentDebt || 0) > 0 && (
                  <div className="bg-rose-50/80 px-3.5 py-2.5 rounded-xl border border-rose-200/70 flex justify-between items-center">
                    <span className="text-xs font-semibold text-rose-800">Saldo pendiente</span>
                    <span className="font-mono font-black text-rose-700 text-sm">
                      ${(client.currentDebt || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Pie de tarjeta estilo Apple: Ruta directa y micro-interacción */}
              <div className="pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    Portal
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-700 truncate max-w-[170px] sm:max-w-[220px]">
                    /p/{client.qrToken}
                  </span>
                </div>
                <span className="text-[#0071e3] font-bold text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex items-center gap-0.5 shrink-0">
                  Abrir &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

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
              {deleteError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {deleteError}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setClientToDelete(null);
                  setDeleteError(null);
                }}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  setDeleteError(null);
                  const ok = await deleteClient(clientToDelete.id);
                  setIsDeleting(false);
                  if (ok) {
                    setClientToDelete(null);
                  } else {
                    setDeleteError('No se pudo eliminar de la base de datos. Intente nuevamente.');
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
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
