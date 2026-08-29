'use client';

import React, { useState } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { VectorMap } from '@/components/maps/VectorMap';
import { Gender, Client } from '@/types';
import { X, UserPlus, MapPin, Store, Phone, User, Check } from 'lucide-react';

interface ClientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: Client) => void;
}

export function ClientRegistrationModal({
  isOpen,
  onClose,
  onClientCreated,
}: ClientRegistrationModalProps) {
  const { addClient } = useDistribution();

  const [fullName, setFullName] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Hombre');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('+593');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -0.180653,
    lng: -78.467834,
  });
  const [taxId, setTaxId] = useState<string>('');
  const [taxIdType, setTaxIdType] = useState<'04' | '05' | '06' | '07'>('05');
  const [email, setEmail] = useState<string>('');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [addressReference, setAddressReference] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) newErrors.fullName = 'El nombre completo es requerido';
    if (!whatsappNumber.trim() || whatsappNumber === '+593') {
      newErrors.whatsappNumber = 'El número de WhatsApp es requerido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const created = addClient({
      fullName,
      businessName,
      gender,
      whatsappNumber,
      latitude: coords.lat,
      longitude: coords.lng,
      addressReference,
      taxId: taxId.trim() || undefined,
      taxIdType,
      email: email.trim() || undefined,
      creditLimit,
    });

    // Reset form
    setFullName('');
    setBusinessName('');
    setWhatsappNumber('+593');
    setTaxId('');
    setEmail('');
    setCreditLimit(0);
    setAddressReference('');
    setErrors({});

    onClose();
    onClientCreated(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 my-8">
        {/* Header bar (Light theme) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">Registro de Nuevo Local Comercial</h2>
              <p className="text-xs text-slate-500">Genera su código QR único y coordenadas GPS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Nombre del Propietario *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Carlos Mendoza"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
              />
              {errors.fullName && (
                <p className="text-[11px] text-red-600 font-medium">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Store className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Nombre del Local / Negocio
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. Minimarket Los Rosales"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                WhatsApp para Notificaciones *
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+593987654321"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
              />
              {errors.whatsappNumber && (
                <p className="text-[11px] text-red-600 font-medium">{errors.whatsappNumber}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Género</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
              >
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 block">Tipo Identificación</label>
              <select
                value={taxIdType}
                onChange={(e) => setTaxIdType(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 font-medium"
              >
                <option value="05">Cédula (05)</option>
                <option value="04">RUC (04)</option>
                <option value="07">Consumidor Final (07)</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 block">RUC / Cédula</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="1792345678001"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 block">Cupo Crédito ($)</label>
              <input
                type="number"
                step="5"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                placeholder="0.00"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Correo Electrónico (Facturación Electrónica SRI)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@gmail.com"
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Interactive GPS Map Picker */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-red-600" />
                Ubicación Exacta de Entrega (Arrastra el Marcador)
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            </div>

            <VectorMap
              latitude={coords.lat}
              longitude={coords.lng}
              draggableMarker={true}
              onLocationChange={(lat, lng) => setCoords({ lat, lng })}
              className="h-44 w-full rounded-2xl border border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Referencia de Dirección o Calles del Local
            </label>
            <input
              type="text"
              value={addressReference}
              onChange={(e) => setAddressReference(e.target.value)}
              placeholder="Ej. Av. 6 de Diciembre y Orellana, frente a la farmacia"
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar y Generar Código QR</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
