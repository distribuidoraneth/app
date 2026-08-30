'use client';

import React, { useState } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { VectorMap } from '@/components/maps/VectorMap';
import { Gender, Client } from '@/types';
import {
  X,
  UserPlus,
  MapPin,
  Store,
  Phone,
  User,
  Check,
  Search,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Mail,
} from 'lucide-react';

interface ClientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: (client: Client) => void;
  initialCoords?: { latitude: number; longitude: number };
}

export function ClientRegistrationModal({
  isOpen,
  onClose,
  onClientCreated,
  initialCoords,
}: ClientRegistrationModalProps) {
  const { addClient } = useDistribution();

  const [fullName, setFullName] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Hombre');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('+593');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialCoords?.latitude ?? -1.24908, // Ambato centro
    lng: initialCoords?.longitude ?? -78.61675,
  });
  const [taxId, setTaxId] = useState<string>('');
  const [taxIdType, setTaxIdType] = useState<'04' | '05' | '06' | '07'>('05');
  const [email, setEmail] = useState<string>('');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [addressReference, setAddressReference] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // EcuadorAPI State
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [apiFeedback, setApiFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleLookupEcuadorApi = async () => {
    const cleanId = taxId.replace(/\D/g, '').trim();
    if (cleanId.length !== 10 && cleanId.length !== 13) {
      setApiFeedback({
        type: 'error',
        message: 'Ingresa una Cédula válida de 10 dígitos o RUC de 13 dígitos.',
      });
      return;
    }

    setIsSearchingApi(true);
    setApiFeedback(null);

    try {
      const res = await fetch(`/api/ecuador/consulta?taxId=${cleanId}`);
      const data = await res.json();

      if (data.success) {
        if (data.fullName) setFullName(data.fullName);
        if (data.businessName) setBusinessName(data.businessName);
        if (data.addressReference) setAddressReference(data.addressReference);
        if (data.gender) setGender(data.gender);
        if (data.taxIdType) setTaxIdType(data.taxIdType);

        setApiFeedback({
          type: 'success',
          message: `✓ Datos de ${data.taxIdType === '04' ? 'RUC SRI' : 'Registro Civil'} autocompletados correctamente.`,
        });
      } else {
        setApiFeedback({
          type: 'error',
          message: data.error || 'No se encontraron datos para este documento.',
        });
      }
    } catch {
      setApiFeedback({
        type: 'error',
        message: 'Error al conectar con el servicio de consulta en línea.',
      });
    } finally {
      setIsSearchingApi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) newErrors.fullName = 'El nombre o razón social es requerido';
    if (!whatsappNumber.trim() || whatsappNumber === '+593') {
      newErrors.whatsappNumber = 'El número de WhatsApp es requerido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const created = addClient({
      fullName,
      businessName: businessName.trim() || fullName,
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
    setApiFeedback(null);

    onClose();
    onClientCreated?.(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 my-8">
        {/* Header bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">Registro de Nuevo Local Comercial</h2>
              <p className="text-xs text-slate-500">Genera su código QR único y consulta datos oficiales en línea</p>
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
          {/* EcuadorAPI Fast Autofill Banner */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-blue-900 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Consulta RUC / Cédula (EcuadorAPI)
              </label>
              <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                Autocompletado SRI
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={taxId}
                onChange={(e) => {
                  setTaxId(e.target.value);
                  const clean = e.target.value.replace(/\D/g, '');
                  if (clean.length === 13) setTaxIdType('04');
                  else if (clean.length === 10) setTaxIdType('05');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupEcuadorApi();
                  }
                }}
                placeholder="Ingresa RUC (13 dígitos) o Cédula (10 dígitos)"
                className="flex-1 text-xs px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleLookupEcuadorApi}
                disabled={isSearchingApi || !taxId.trim()}
                className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center space-x-1 transition-all shadow-xs shrink-0"
              >
                {isSearchingApi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>{isSearchingApi ? 'Consultando...' : 'Consultar'}</span>
              </button>
            </div>

            {apiFeedback && (
              <p
                className={`text-[11px] font-medium flex items-center ${
                  apiFeedback.type === 'success' ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {apiFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                )}
                {apiFeedback.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Nombre / Razón Social *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Carlos Mendoza o Comercial Aneth S.A."
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
              />
              {errors.fullName && (
                <p className="text-[11px] text-red-600 font-medium">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Store className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Nombre Comercial del Local
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
                WhatsApp para Envíos y Facturas *
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
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Email Tributario (SRI)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
              />
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
              <label className="text-xs font-bold text-slate-700 block">Género / Tipo</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 font-medium"
              >
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Empresa">Empresa</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 block">Cupo Crédito ($)</label>
              <input
                type="number"
                step="5"
                min="0"
                value={creditLimit}
                onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Dirección y Referencia de Entrega
            </label>
            <input
              type="text"
              value={addressReference}
              onChange={(e) => setAddressReference(e.target.value)}
              placeholder="Ej. Huachi Chico, Av. Atahualpa y Teodoro Solis, casa salmón"
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
            />
          </div>

          {/* Coordenadas GPS en Mapa Vectorial */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Ubicación GPS Exacta en Ruta:</span>
              <span className="text-[11px] font-mono text-blue-600 font-normal">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            </label>
            <div className="h-44 rounded-2xl overflow-hidden border border-slate-300 shadow-inner">
              <VectorMap
                latitude={coords.lat}
                longitude={coords.lng}
                zoom={14}
                interactive={true}
                draggableMarker={true}
                onLocationChange={(lat, lng) => setCoords({ lat, lng })}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              * Haz clic en el mapa para ajustar la ubicación exacta del local para el camión de reparto.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs flex items-center space-x-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Guardar y Generar QR</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
