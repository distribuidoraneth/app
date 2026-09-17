'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDistribution } from '@/context/DistributionContext';
import { Gender, Client, ClientTier } from '@/types';
import {
  ApplePersonBadgePlusIcon,
  ApplePersonTextRectangleIcon,
  AppleMapPinIcon,
  AppleLocationMagnifyingGlassIcon,
  AppleWhatsAppIcon,
  AppleStorefrontIcon,
  ApplePencilIcon,
} from '@/components/ui/AppleIcons';
import {
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  Tag,
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

  // Referencias para calibración controlada de GPS
  const watchIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const bestReadingRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);

  // Obtener dirección oficial de Google Maps por coordenadas GPS (llamada única por calibración)
  const fetchGoogleAddress = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`/api/maps/geocode?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data.success && data.address) {
        setAddressReference(data.address);
      }
    } catch (err) {
      console.warn('Error al geocodificar dirección con Google Maps:', err);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Calibración finita (máximo 4 segundos o cuando logre precisión óptima <= 15m)
  const calibrateGps = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setIsCalibratingGps(false);
      return;
    }

    // Cancelar cualquier escaneo previo en curso
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    setIsCalibratingGps(true);
    bestReadingRef.current = null;

    // Finalizar: detiene el sensor satelital y consulta Google Maps UNA SOLA VEZ
    const finalizeGpsFix = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      setIsCalibratingGps(false);

      if (bestReadingRef.current) {
        const { lat, lng, accuracy } = bestReadingRef.current;
        setCoords({ lat, lng });
        setGpsAccuracy(accuracy);
        fetchGoogleAddress(lat, lng);
      }
    };

    // Ventana máxima de 4 segundos: si está bajo techo o la señal tarda, toma la mejor lectura obtenida y para
    timeoutIdRef.current = setTimeout(() => {
      finalizeGpsFix();
    }, 4000);

    // Iniciar lectura satelital
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const roundedAcc = Math.round(accuracy);

        // Guardar la mejor lectura detectada
        if (!bestReadingRef.current || roundedAcc < bestReadingRef.current.accuracy) {
          bestReadingRef.current = { lat: latitude, lng: longitude, accuracy: roundedAcc };
          setGpsAccuracy(roundedAcc);
        }

        // Si ya tenemos precisión excelente (<= 15 metros), fijar de inmediato sin esperar más tiempo
        if (roundedAcc <= 15) {
          finalizeGpsFix();
        }
      },
      (err) => {
        console.warn('Sensor GPS:', err.message);
        finalizeGpsFix();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    watchIdRef.current = id;
  }, [fetchGoogleAddress]);

  // Al abrir la vista, si es un nuevo local, se calibra automáticamente una sola vez
  useEffect(() => {
    if (!clientToEdit) {
      calibrateGps();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [clientToEdit, calibrateGps]);

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
        if (data.addressReference && !addressReference && !bestReadingRef.current) {
          setAddressReference(data.addressReference);
        }
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
        creditLimit: clientToEdit?.creditLimit ?? 0,
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

      {/* Encabezado sin tarjeta: Título e ícono limpio con identidad azul celeste */}
      <div className="flex items-center space-x-3 sm:space-x-4 pt-1">
        <div className="shrink-0">
          {clientToEdit ? (
            <ApplePencilIcon size={32} className="text-blue-600" alt="Editar" />
          ) : (
            <ApplePersonBadgePlusIcon size={36} className="text-blue-600" alt="Nuevo Local" />
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-blue-600">
          {clientToEdit ? 'Modificar Local' : 'Registro de Local'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* SECCIÓN 1: Identificación */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center space-x-2">
              <ApplePersonTextRectangleIcon size={20} alt="Identificación" />
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
                  title={taxValidation.isValid ? 'Consultar' : 'Completa el número válido'}
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

            {/* Error si el número ingresado no es válido al completar la longitud */}
            {currentLength === expectedLength && !taxValidation.isValid && taxValidation.error && (
              <p className="text-xs font-bold text-rose-600 flex items-center space-x-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{taxValidation.error}</span>
              </p>
            )}

            {apiFeedback && apiFeedback.type === 'error' && (
              <p className="text-xs font-bold text-rose-600 flex items-center space-x-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{apiFeedback.message}</span>
              </p>
            )}
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
                  type="tel"
                  inputMode="numeric"
                  maxLength={12}
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
                readOnly={isOfficialDataLocked && !!birthDate}
                tabIndex={isOfficialDataLocked && !!birthDate ? -1 : 0}
                onChange={(e) => setBirthDate(e.target.value)}
                className={`w-full h-11 px-3.5 rounded-xl border text-sm font-bold transition-colors ${
                  isOfficialDataLocked && birthDate
                    ? 'bg-slate-100/90 border-slate-200 text-slate-600 cursor-not-allowed select-none'
                    : 'bg-slate-50 hover:bg-slate-100/60 focus:bg-white border-slate-200 text-slate-900 focus:outline-hidden focus:border-blue-500'
                }`}
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
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <AppleMapPinIcon size={18} alt="Ubicación" />
              <h2 className="text-sm sm:text-base font-black text-slate-900">Ubicación</h2>

              {/* Badge de Estado del GPS */}
              {isCalibratingGps ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-2xs font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping mr-0.5" />
                  <span>Sintonizando señal...</span>
                </span>
              ) : isGeocoding ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-2xs font-bold">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  <span>Obteniendo calle...</span>
                </span>
              ) : gpsAccuracy !== null ? (
                <span
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-2xs font-black ${
                    gpsAccuracy <= 15
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : 'bg-amber-50 text-amber-700 border-amber-200/80'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      gpsAccuracy <= 15 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>
                    {gpsAccuracy <= 15 ? `GPS Exacto (±${gpsAccuracy}m)` : `GPS Fijado (±${gpsAccuracy}m)`}
                  </span>
                </span>
              ) : null}
            </div>

            {/* Acción: Refrescar GPS */}
            <div className="flex items-center self-start sm:self-auto">
              <button
                type="button"
                onClick={calibrateGps}
                disabled={isCalibratingGps || isGeocoding}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-95 disabled:opacity-50 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                <AppleLocationMagnifyingGlassIcon
                  size={14}
                  className={isCalibratingGps || isGeocoding ? 'animate-pulse text-blue-600' : 'text-slate-600'}
                />
                <span>{isCalibratingGps ? 'Calibrando...' : 'Refrescar GPS'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={2}
              value={addressReference}
              onChange={(e) => setAddressReference(e.target.value)}
              placeholder="Dirección del local (se obtiene automáticamente con Google Maps)..."
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* SECCIÓN 4: Condiciones Comerciales */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center space-x-2">
              <Tag className="w-4.5 h-4.5 text-blue-600" />
              <span>Condiciones Comerciales</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
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
