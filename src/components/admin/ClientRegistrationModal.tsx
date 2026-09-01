'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { GoogleMapPreview } from '@/components/maps/GoogleMapPreview';
import { Gender, Client, ClientTier } from '@/types';
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
  Lock,
  Mail,
  Cake,
  CheckCircle2,
  Tag,
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
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialCoords?.latitude ?? -1.24908,
    lng: initialCoords?.longitude ?? -78.61675,
  });
  const [taxId, setTaxId] = useState<string>('');
  const [taxIdType, setTaxIdType] = useState<'04' | '05'>('05');
  const [email, setEmail] = useState<string>('');
  const [clientTier, setClientTier] = useState<ClientTier>('normal');
  const [addressReference, setAddressReference] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Query & Lock State
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [isOfficialDataLocked, setIsOfficialDataLocked] = useState<boolean>(false);
  const [apiFeedback, setApiFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Google Reverse Geocoding & Continuous Auto-GPS State
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isCalibratingGps, setIsCalibratingGps] = useState<boolean>(true);
  const lastGeocodedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const bestAccuracyRef = useRef<number>(999999);

  // Helper: Haversine distance in meters
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch official Google Maps address from GPS coordinates
  const fetchGoogleAddress = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`/api/maps/geocode?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data.success && data.address) {
        setAddressReference(data.address);
        lastGeocodedCoordsRef.current = { lat, lng };
      }
    } catch (err) {
      console.warn('Error al obtener dirección oficial de Google Maps:', err);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Continuous GPS auto-refinement in real-time (no buttons needed)
  useEffect(() => {
    if (!isOpen) return;

    if (initialCoords) {
      setCoords({ lat: initialCoords.latitude, lng: initialCoords.longitude });
      fetchGoogleAddress(initialCoords.latitude, initialCoords.longitude);
      setIsCalibratingGps(false);
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setIsCalibratingGps(false);
      return;
    }

    setIsCalibratingGps(true);
    bestAccuracyRef.current = 999999;
    lastGeocodedCoordsRef.current = null;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        setGpsAccuracy(accuracy);
        setIsCalibratingGps(false);

        const last = lastGeocodedCoordsRef.current;
        const distanceMoved = last ? getDistanceMeters(last.lat, last.lng, newLat, newLng) : 999;

        // Auto-refine if accuracy improves noticeably or moved to storefront
        if (!last || (accuracy < bestAccuracyRef.current - 10 && distanceMoved > 5) || distanceMoved > 20) {
          setCoords({ lat: newLat, lng: newLng });
          if (accuracy < bestAccuracyRef.current) {
            bestAccuracyRef.current = accuracy;
          }
          fetchGoogleAddress(newLat, newLng);
        }
      },
      (err) => {
        console.warn('Advertencia GPS:', err);
        setIsCalibratingGps(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isOpen, initialCoords, fetchGoogleAddress]);

  if (!isOpen) return null;

  // Lookup Official Civil Registry / SRI Data
  const handleLookup = async () => {
    const cleanId = taxId.replace(/\D/g, '').trim();
    if (cleanId.length !== 10 && cleanId.length !== 13) {
      setApiFeedback({
        type: 'error',
        message: 'Ingresa 10 dígitos para Cédula o 13 para RUC.',
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
        if (data.gender) setGender(data.gender);
        if (data.taxIdType) setTaxIdType(data.taxIdType === '04' ? '04' : '05');
        if (data.birthDate) {
          const parts = data.birthDate.split('/');
          if (parts.length === 3) {
            setBirthDate(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
          } else {
            setBirthDate(data.birthDate);
          }
        }

        setIsOfficialDataLocked(true);
        setApiFeedback({
          type: 'success',
          message: 'Datos oficiales verificados y bloqueados automáticamente.',
        });
      } else {
        setApiFeedback({
          type: 'error',
          message: data.error || 'No se pudo consultar automáticamente. Completa los datos a continuación.',
        });
      }
    } catch {
      setApiFeedback({
        type: 'error',
        message: 'No se pudo conectar al servicio. Puedes ingresar los datos manualmente.',
      });
    } finally {
      setIsSearchingApi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    const rawDigits = whatsappNumber.replace(/\D/g, '');
    if (!rawDigits || rawDigits.length < 9) {
      newErrors.whatsappNumber = 'Ingresa un número celular válido (ej: 099 123 4567)';
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'El nombre o razón social es requerido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Format phone cleanly starting with 0
    let formattedPhone = rawDigits;
    if (formattedPhone.startsWith('593')) {
      formattedPhone = '0' + formattedPhone.slice(3);
    } else if (!formattedPhone.startsWith('0') && formattedPhone.length === 9) {
      formattedPhone = '0' + formattedPhone;
    }

    const created = addClient({
      fullName,
      businessName: businessName.trim() || fullName,
      gender,
      clientTier,
      whatsappNumber: formattedPhone,
      latitude: coords.lat,
      longitude: coords.lng,
      addressReference: addressReference.trim() || 'Ubicación GPS confirmada por Google Maps',
      taxId: taxId.trim() || undefined,
      taxIdType,
      email: email.trim() || undefined,
      creditLimit: 0,
      birthDate: birthDate || undefined,
    });

    // Reset form
    setFullName('');
    setBusinessName('');
    setWhatsappNumber('');
    setBirthDate('');
    setTaxId('');
    setEmail('');
    setClientTier('normal');
    setAddressReference('');
    setErrors({});
    setApiFeedback(null);
    setIsOfficialDataLocked(false);

    onClose();
    onClientCreated?.(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto sm:my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header bar - Grande y Legible */}
        <div className="bg-slate-50/90 border-b border-slate-200 px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl text-slate-900 leading-tight">
                Registro de Cliente
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                Alta rápida para venta y facturación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form - Espacioso, Cómodo y con Fuentes Grandes para Móvil */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Cédula o RUC Input & Fast Query */}
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between">
              <label className="text-sm sm:text-base font-black text-slate-900 block">
                Cédula o RUC
              </label>

              {/* Document Type Pills */}
              <div className="flex items-center bg-slate-200/90 p-1 rounded-xl text-xs sm:text-sm font-black border border-slate-300/70">
                <button
                  type="button"
                  onClick={() => setTaxIdType('05')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                    taxIdType === '05'
                      ? 'bg-white text-blue-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cédula
                </button>
                <button
                  type="button"
                  onClick={() => setTaxIdType('04')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                    taxIdType === '04'
                      ? 'bg-white text-blue-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  RUC
                </button>
              </div>
            </div>

            <div className="flex items-stretch gap-2 w-full">
              <input
                type="text"
                value={taxId}
                disabled={isOfficialDataLocked}
                onChange={(e) => {
                  setTaxId(e.target.value);
                  const clean = e.target.value.replace(/\D/g, '');
                  if (clean.length === 13) setTaxIdType('04');
                  else if (clean.length === 10) setTaxIdType('05');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookup();
                  }
                }}
                placeholder={taxIdType === '04' ? 'Ingresa RUC (13 dígitos)' : 'Ingresa Cédula (10 dígitos)'}
                className={`flex-1 min-w-0 text-sm sm:text-base px-3.5 sm:px-4 py-3 sm:py-3.5 bg-white border rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden ${
                  isOfficialDataLocked
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'border-slate-300 text-slate-900 font-bold placeholder:font-normal'
                }`}
              />

              {isOfficialDataLocked ? (
                <button
                  type="button"
                  onClick={() => setIsOfficialDataLocked(false)}
                  className="px-3.5 py-3 sm:py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer"
                  title="Desbloquear para editar número"
                >
                  Cambiar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={isSearchingApi || !taxId.trim()}
                  className="w-12 sm:w-14 shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-xs cursor-pointer"
                  title="Consultar Cédula o RUC"
                >
                  {isSearchingApi ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 stroke-[2.5]" />
                  )}
                </button>
              )}
            </div>

            {apiFeedback && (
              <p
                className={`text-xs sm:text-sm font-bold flex items-center pt-0.5 ${
                  apiFeedback.type === 'success' ? 'text-emerald-700' : 'text-slate-600'
                }`}
              >
                {apiFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />}
                {apiFeedback.message}
              </p>
            )}
          </div>

          {/* Nombre Oficial (Bloqueado si vino de la API) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center">
                <User className="w-4 h-4 mr-1.5 text-slate-500" />
                <span>Nombre / Razón Social *</span>
              </label>
              {isOfficialDataLocked && (
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center shadow-2xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Oficial Verificado
                </span>
              )}
            </div>

            <input
              type="text"
              value={fullName}
              readOnly={isOfficialDataLocked}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Carlos Mendoza"
              className={`w-full text-sm sm:text-base px-4 py-3 sm:py-3.5 border rounded-xl font-bold ${
                isOfficialDataLocked
                  ? 'bg-slate-100/90 border-slate-200 text-slate-800 cursor-not-allowed select-text'
                  : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden'
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 font-bold">{errors.fullName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre Comercial */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center">
                <Store className="w-4 h-4 mr-1.5 text-slate-500" />
                Nombre Comercial del Local
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. Minimarket Los Rosales"
                className="w-full text-sm sm:text-base px-4 py-3 sm:py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-semibold text-slate-900"
              />
            </div>

            {/* Fecha de Cumpleaños / Fidelización */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center">
                  <Cake className="w-4 h-4 mr-1.5 text-blue-600" />
                  Fecha de Cumpleaños
                </label>
                {isOfficialDataLocked && birthDate && (
                  <span className="text-[11px] font-black text-slate-500 flex items-center">
                    <Lock className="w-3 h-3 mr-0.5" />
                    Bloqueado
                  </span>
                )}
              </div>
              <input
                type="date"
                value={birthDate}
                readOnly={isOfficialDataLocked && !!birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={`w-full text-sm sm:text-base px-4 py-3 sm:py-3.5 border rounded-xl font-mono font-bold appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-inner-spin-button]:hidden ${
                  isOfficialDataLocked && birthDate
                    ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WhatsApp para Envíos (Editable y con fuente grande) */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center">
                <Phone className="w-4 h-4 mr-1.5 text-emerald-600" />
                WhatsApp / Celular *
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d\s]/g, '');
                  setWhatsappNumber(val);
                }}
                placeholder="099 123 4567"
                className="w-full text-base sm:text-lg px-4 py-3 sm:py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
              />
              {errors.whatsappNumber && (
                <p className="text-xs text-red-600 font-bold">{errors.whatsappNumber}</p>
              )}
            </div>

            {/* Email para Facturación */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center">
                <Mail className="w-4 h-4 mr-1.5 text-slate-500" />
                Email Tributario (SRI)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full text-sm sm:text-base px-4 py-3 sm:py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Selectores de Género y Tarifa de Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-black text-slate-800 block">
                Género / Tipo
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/90">
                {(['Hombre', 'Mujer', 'Otro'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    disabled={isOfficialDataLocked}
                    onClick={() => setGender(g)}
                    className={`py-2.5 sm:py-3 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
                      gender === g
                        ? 'bg-white text-blue-700 shadow-xs font-black ring-1 ring-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    } ${isOfficialDataLocked ? 'cursor-not-allowed opacity-90' : ''}`}
                  >
                    {g === 'Otro' ? 'Empresa' : g}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarifa de Precios (Normal / Distribuidor / Especial) */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center">
                <Tag className="w-4 h-4 mr-1.5 text-blue-600" />
                Tarifa de Precios
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/90">
                {(
                  [
                    { id: 'normal', label: 'Normal' },
                    { id: 'distribuidor', label: 'Distribuidor' },
                    { id: 'especial', label: 'Especial' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setClientTier(t.id)}
                    className={`py-2.5 sm:py-3 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
                      clientTier === t.id
                        ? 'bg-white text-blue-700 shadow-xs font-black ring-1 ring-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dirección Oficial Bloqueada de Google Maps */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-red-500" />
                <span>Dirección Oficial (Google Maps)</span>
              </label>
              {isGeocoding ? (
                <span className="text-xs font-bold text-blue-600 flex items-center">
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Obteniendo de Google...
                </span>
              ) : addressReference ? (
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center shadow-2xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Oficial Verificada
                </span>
              ) : (
                <span className="text-xs text-amber-600 font-bold flex items-center">
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Ajustando GPS...
                </span>
              )}
            </div>
            <input
              type="text"
              value={addressReference}
              readOnly
              placeholder="Detectando y fijando dirección con GPS..."
              className="w-full text-xs sm:text-sm px-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl bg-slate-100/90 text-slate-850 font-semibold cursor-not-allowed select-text leading-relaxed"
            />
          </div>

          {/* Mapa Oficial de Google Maps - Fijo y No Desplazable */}
          <div className="space-y-2 pt-1">
            <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center justify-between">
              <span>Ubicación GPS Oficial (Google Maps):</span>
              <span className="text-xs text-slate-500 font-bold">Bloqueado para máxima precisión</span>
            </label>

            <GoogleMapPreview
              latitude={coords.lat}
              longitude={coords.lng}
              accuracy={gpsAccuracy}
              isCalibrating={isCalibratingGps}
              zoom={17}
              className="h-44 sm:h-52 w-full rounded-2xl overflow-hidden"
            />
          </div>

          {/* Action buttons - Grandes y Cómodos para el Pulgar */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs sm:text-sm font-black transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Guardar Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
