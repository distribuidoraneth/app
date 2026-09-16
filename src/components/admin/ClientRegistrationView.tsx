'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDistribution } from '@/context/DistributionContext';
import { Gender, Client, ClientTier } from '@/types';
import {
  ApplePersonBadgePlusIcon,
  AppleMapPinIcon,
  AppleWhatsAppIcon,
  AppleStorefrontIcon,
  ApplePencilIcon,
} from '@/components/ui/AppleIcons';
import {
  ArrowLeft,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  DollarSign,
  Calendar,
} from 'lucide-react';
import {
  formatEcuadorianPhone,
  validateEcuadorianPhone,
  validateEcuadorianTaxId,
  validateEcuadorianCedula,
  validateEcuadorianRuc,
  TaxIdValidationResult,
} from '@/lib/utils/ecuadorValidators';

interface ClientRegistrationViewProps {
  clientIdToEdit?: string | null;
}

export function ClientRegistrationView({ clientIdToEdit }: ClientRegistrationViewProps) {
  const router = useRouter();
  const { clients, addClient, updateClient } = useDistribution();

  // Buscar cliente existente si viene para edición
  const clientToEdit = clientIdToEdit ? clients.find((c) => c.id === clientIdToEdit) || null : null;

  // Estados del Formulario
  const [fullName, setFullName] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Hombre');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [taxIdType, setTaxIdType] = useState<'04' | '05'>('05');
  const [email, setEmail] = useState<string>('');
  const [clientTier, setClientTier] = useState<ClientTier>('normal');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [addressReference, setAddressReference] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -1.24908,
    lng: -78.61675,
  });

  // Estados de Validación y API
  const [taxValidation, setTaxValidation] = useState<TaxIdValidationResult>({
    isValid: false,
    type: '05',
    cleanDigits: '',
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [isOfficialDataLocked, setIsOfficialDataLocked] = useState<boolean>(false);
  const [apiFeedback, setApiFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Estados de GPS y Geocodificación
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isCalibratingGps, setIsCalibratingGps] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Cargar datos del cliente si estamos en modo edición
  useEffect(() => {
    if (clientToEdit) {
      setFullName(clientToEdit.fullName || '');
      setBusinessName(clientToEdit.businessName || '');
      setGender((clientToEdit.gender as Gender) || 'Hombre');
      setWhatsappNumber(formatEcuadorianPhone(clientToEdit.whatsappNumber || ''));
      setBirthDate(clientToEdit.birthDate || '');
      setTaxId(clientToEdit.taxId || '');
      setTaxIdType((clientToEdit.taxIdType as '04' | '05') || (clientToEdit.taxId?.length === 13 ? '04' : '05'));
      setEmail(clientToEdit.email || '');
      setClientTier((clientToEdit.clientTier as ClientTier) || 'normal');
      setCreditLimit(clientToEdit.creditLimit || 0);
      setAddressReference(clientToEdit.addressReference || '');
      if (clientToEdit.latitude && clientToEdit.longitude) {
        setCoords({ lat: clientToEdit.latitude, lng: clientToEdit.longitude });
      }
      setIsOfficialDataLocked(Boolean(clientToEdit.taxId));
    }
  }, [clientToEdit]);

  // Validar en tiempo real la identificación ecuatoriana con el algoritmo matemático
  useEffect(() => {
    if (!taxId.trim()) {
      setTaxValidation({ isValid: false, type: taxIdType, cleanDigits: '' });
      return;
    }

    const clean = taxId.replace(/\D/g, '');
    const result = taxIdType === '04' ? validateEcuadorianRuc(clean) : validateEcuadorianCedula(clean);
    setTaxValidation(result);
  }, [taxId, taxIdType]);

  // Obtener dirección oficial de Google Maps por coordenadas
  const fetchGoogleAddress = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`/api/maps/geocode?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data.success && data.address) {
        setAddressReference(data.address);
      }
    } catch (err) {
      console.warn('Error al geocodificar dirección:', err);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Calibrar GPS del dispositivo
  const handleCalibrateGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    setIsCalibratingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setGpsAccuracy(Math.round(accuracy));
        fetchGoogleAddress(latitude, longitude);
        setIsCalibratingGps(false);
      },
      (err) => {
        console.warn('Error de GPS:', err.message);
        setIsCalibratingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Manejador del cambio de Cédula/RUC con limitador estricto de dígitos
  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.replace(/\D/g, '');
    const maxLen = taxIdType === '04' ? 13 : 10;
    const limited = clean.slice(0, maxLen);
    setTaxId(limited);
    setApiFeedback(null);
  };

  // Consulta Segura a EcuadorAPI (SOLO se ejecuta si el algoritmo valida con éxito)
  const handleLookup = async () => {
    if (!taxValidation.isValid) return;

    setIsSearchingApi(true);
    setApiFeedback(null);

    try {
      const clean = taxId.replace(/\D/g, '');
      const res = await fetch(`/api/ecuador/consulta?taxId=${clean}`);
      const data = await res.json();

      if (data.success) {
        if (data.fullName) setFullName(data.fullName);
        if (data.businessName) setBusinessName(data.businessName);
        if (data.gender) setGender(data.gender as Gender);
        if (data.addressReference && !addressReference) setAddressReference(data.addressReference);
        if (data.birthDate) setBirthDate(data.birthDate);

        setIsOfficialDataLocked(true);
        setApiFeedback({
          type: 'success',
          message: `Datos verificados con éxito en ${taxIdType === '04' ? 'el SRI' : 'el Registro Civil'}.`,
        });
      } else {
        setApiFeedback({
          type: 'error',
          message: data.error || 'No se encontraron registros en el sistema oficial.',
        });
      }
    } catch (err: any) {
      setApiFeedback({
        type: 'error',
        message: 'Error de conexión con el servicio de consulta.',
      });
    } finally {
      setIsSearchingApi(false);
    }
  };

  // Guardar Cliente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert('Por favor, ingresa el nombre o razón social del cliente.');
      return;
    }

    if (whatsappNumber.trim()) {
      const phoneRes = validateEcuadorianPhone(whatsappNumber);
      if (!phoneRes.isValid) {
        setPhoneError(phoneRes.error || 'Número de celular inválido');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const clientData = {
        fullName: fullName.trim(),
        businessName: businessName.trim() || fullName.trim(),
        gender,
        whatsappNumber: formatEcuadorianPhone(whatsappNumber),
        latitude: coords.lat,
        longitude: coords.lng,
        addressReference: addressReference.trim(),
        taxId: taxId.trim() || undefined,
        taxIdType: (taxId.trim() ? taxIdType : '07') as '04' | '05' | '06' | '07',
        email: email.trim() || undefined,
        clientTier,
        creditLimit: Number(creditLimit) || 0,
        birthDate: birthDate || undefined,
      };

      if (clientToEdit) {
        updateClient({
          ...clientToEdit,
          ...clientData,
        });
      } else {
        addClient(clientData);
      }

      router.push('/admin/clientes');
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      alert('Ocurrió un error al guardar el cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCedula = taxIdType === '05';
  const expectedLength = isCedula ? 10 : 13;
  const currentLength = taxId.replace(/\D/g, '').length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-12">
      {/* Barra de Retorno y Título Principal */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/clientes"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs sm:text-sm transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Clientes</span>
        </Link>

        <span className="text-xs text-slate-500 font-bold hidden sm:inline-block">
          {clientToEdit ? 'Editando Local' : 'Nuevo Registro'}
        </span>
      </div>

      {/* Header Card de la Pantalla */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            {clientToEdit ? (
              <ApplePencilIcon size={22} className="brightness-0 invert" alt="Editar" />
            ) : (
              <ApplePersonBadgePlusIcon size={24} className="brightness-0 invert" alt="Nuevo Local" />
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {clientToEdit ? 'Modificar Local' : 'Registro de Local'}
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* SECCIÓN 1: Identificación */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-600" />
              <span>Identificación</span>
            </h2>

            {/* Selector Cédula / RUC */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setTaxIdType('05');
                  setTaxId('');
                  setApiFeedback(null);
                  setIsOfficialDataLocked(false);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isCedula ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cédula
              </button>
              <button
                type="button"
                onClick={() => {
                  setTaxIdType('04');
                  setTaxId('');
                  setApiFeedback(null);
                  setIsOfficialDataLocked(false);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  !isCedula ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                RUC
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={expectedLength}
                  value={taxId}
                  disabled={isOfficialDataLocked}
                  onChange={handleTaxIdChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (taxValidation.isValid) handleLookup();
                    }
                  }}
                  placeholder={isCedula ? 'Cédula' : 'RUC'}
                  className={`w-full h-11 px-3.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border text-sm font-mono font-bold transition-all focus:outline-hidden ${
                    isOfficialDataLocked
                      ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      : taxValidation.isValid
                      ? 'border-emerald-500 focus:border-emerald-600 text-slate-900'
                      : currentLength === expectedLength
                      ? 'border-rose-400 focus:border-rose-500 text-rose-900'
                      : 'border-slate-200 focus:border-blue-500 text-slate-900'
                  }`}
                />

                {/* Badge de Conteo */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 pointer-events-none">
                  <span
                    className={`text-xs font-mono font-black ${
                      taxValidation.isValid
                        ? 'text-emerald-600'
                        : currentLength === expectedLength
                        ? 'text-rose-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {currentLength}/{expectedLength}
                  </span>
                </div>
              </div>

              {/* Botón de Consulta Oficial */}
              {isOfficialDataLocked ? (
                <button
                  type="button"
                  onClick={() => setIsOfficialDataLocked(false)}
                  className="h-11 px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-all shrink-0 cursor-pointer"
                >
                  Cambiar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={!taxValidation.isValid || isSearchingApi}
                  className="h-11 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
                  title={taxValidation.isValid ? 'Consultar en línea' : 'Completa el número válido para consultar'}
                >
                  {isSearchingApi ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{isSearchingApi ? 'Consultando...' : 'Consultar'}</span>
                </button>
              )}
            </div>

            {/* Mensajes de Validación Algorítmica en Tiempo Real */}
            <div className="pt-0.5">
              {taxValidation.isValid ? (
                <p className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {isCedula ? 'Cédula' : 'RUC'} matemáticamente válido ({taxValidation.province})
                  </span>
                </p>
              ) : currentLength === expectedLength && taxValidation.error ? (
                <p className="text-xs font-bold text-rose-600 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{taxValidation.error}</span>
                </p>
              ) : currentLength > 0 && currentLength < expectedLength ? (
                <p className="text-xs font-medium text-slate-400">
                  Faltan {expectedLength - currentLength} dígitos para completar la validación.
                </p>
              ) : null}

              {apiFeedback && (
                <p
                  className={`text-xs font-bold mt-1 flex items-center space-x-1 ${
                    apiFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  <span>{apiFeedback.message}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Datos Comerciales */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center space-x-2">
              <AppleStorefrontIcon size={18} alt="Comercio" />
              <span>Datos Comerciales</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Razón Social */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">
                Razón Social *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Carlos Mendoza Andrade"
                className="w-full h-11 px-3.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Nombre del Local */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">
                Nombre del Local
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. Minimarket Los Rosales"
                className="w-full h-11 px-3.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Celular */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">
                Celular
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => {
                    const formatted = formatEcuadorianPhone(e.target.value);
                    setWhatsappNumber(formatted);
                    if (formatted.replace(/\D/g, '').length === 10) {
                      const res = validateEcuadorianPhone(formatted);
                      setPhoneError(res.isValid ? null : res.error || 'Número inválido');
                    } else {
                      setPhoneError(null);
                    }
                  }}
                  placeholder="099 123 4567"
                  className={`w-full h-11 pl-9 pr-3.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border text-sm font-mono font-bold text-slate-900 focus:outline-hidden transition-colors ${
                    phoneError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                <AppleWhatsAppIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70" />
              </div>
              {phoneError && <p className="text-xs text-rose-600 font-bold mt-1">{phoneError}</p>}
            </div>

            {/* Fecha de Cumpleaños */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">
                Cumpleaños
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-11 px-3.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Correo Electrónico */}
            <div className="sm:col-span-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full h-11 px-3.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Ubicación */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center space-x-2">
              <AppleMapPinIcon size={18} alt="Ubicación" />
              <span>Ubicación</span>
            </h2>

            <button
              type="button"
              onClick={handleCalibrateGps}
              disabled={isCalibratingGps || isGeocoding}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold rounded-xl border border-slate-200 text-xs transition-all flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCalibratingGps ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isCalibratingGps ? 'Obteniendo GPS...' : 'Fijar GPS'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">
                Dirección y Referencia
              </label>
              <textarea
                rows={2}
                value={addressReference}
                onChange={(e) => setAddressReference(e.target.value)}
                placeholder="Ej. Av. Cevallos y Montalvo (frente a la farmacia, letrero azul)"
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Coordenadas Actuales */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center space-x-2 font-mono font-bold">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}</span>
                {gpsAccuracy && (
                  <span className="text-emerald-700 font-sans font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md text-2xs">
                    ±{gpsAccuracy}m
                  </span>
                )}
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
              >
                <span>Ver mapa</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Condiciones Comerciales */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center space-x-2">
              <DollarSign className="w-4.5 h-4.5 text-blue-600" />
              <span>Condiciones Comerciales</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {/* Tipo de Cliente */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">
                Tipo
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['Hombre', 'Mujer', 'Empresa'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                      gender === g ? 'bg-white text-blue-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarifa */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">
                Tarifa
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['normal', 'distribuidor', 'especial'] as ClientTier[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setClientTier(t)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center capitalize ${
                      clientTier === t ? 'bg-white text-blue-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Cupo de Crédito */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">
                Cupo Crédito ($)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={creditLimit}
                onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                className="w-full h-11 px-3.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Botonera de Acción Final */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Link
            href="/admin/clientes"
            className="px-5 py-2.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold rounded-xl border border-slate-200 text-sm transition-all shadow-2xs"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{clientToEdit ? 'Guardar Cambios' : 'Registrar y Generar QR'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
