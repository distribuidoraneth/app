'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { GoogleMapPreview } from '@/components/maps/GoogleMapPreview';
import { Gender, Client, ClientTier } from '@/types';
import {
  X,
  UserPlus,
  Search,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { formatEcuadorianPhone, validateEcuadorianPhone } from '@/lib/utils/ecuadorValidators';

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
          message: 'Datos verificados correctamente.',
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

    const phoneValidation = validateEcuadorianPhone(whatsappNumber);
    if (!phoneValidation.isValid) {
      newErrors.whatsappNumber = phoneValidation.error || 'Ingresa un número celular válido (ej: 099 123 4567)';
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'El nombre es obligatorio';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formattedPhone = phoneValidation.cleanDigits;

    const created = addClient({
      fullName,
      businessName: businessName.trim() || fullName,
      gender,
      clientTier,
      whatsappNumber: formattedPhone,
      latitude: coords.lat,
      longitude: coords.lng,
      addressReference: addressReference.trim() || 'Ubicación GPS confirmada',
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[94vh] sm:max-h-[88vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Mobile Drag Indicator Bar */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden bg-slate-50/90">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header Bar */}
        <div className="bg-slate-50/90 border-b border-slate-200/90 px-5 sm:px-7 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="font-black text-lg sm:text-xl text-slate-900 leading-tight">
              Registro de Cliente
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Container with Scrollable Body and Sticky Docked Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5">
            
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
                  className={`flex-1 min-w-0 text-base px-4 py-3.5 bg-white border rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden ${
                    isOfficialDataLocked
                      ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      : 'border-slate-300 text-slate-900 font-bold placeholder:font-normal'
                  }`}
                />

                {isOfficialDataLocked ? (
                  <button
                    type="button"
                    onClick={() => setIsOfficialDataLocked(false)}
                    className="px-4 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-black transition-all shrink-0 cursor-pointer"
                    title="Desbloquear para editar número"
                  >
                    Cambiar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={isSearchingApi || !taxId.trim()}
                    className="w-13 sm:w-14 shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-xs cursor-pointer"
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

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                Nombre
              </label>
              <input
                type="text"
                value={fullName}
                readOnly={isOfficialDataLocked}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Carlos Mendoza"
                className={`w-full text-base px-4 py-3.5 border rounded-xl font-bold ${
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
                <label className="text-sm font-bold text-slate-800 block">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej. Minimarket Los Rosales"
                  className="w-full text-base px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium text-slate-900"
                />
              </div>

              {/* Cumpleaños */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-800 block">
                  Cumpleaños
                </label>
                <input
                  type="date"
                  value={birthDate}
                  readOnly={isOfficialDataLocked && !!birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`w-full text-base px-4 py-3.5 border rounded-xl font-mono font-bold appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-inner-spin-button]:hidden ${
                    isOfficialDataLocked && birthDate
                      ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* WhatsApp */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800 block">
                    WhatsApp
                  </label>
                  {whatsappNumber.replace(/\D/g, '').length === 10 && validateEcuadorianPhone(whatsappNumber).isValid && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Válido
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={12}
                  value={whatsappNumber}
                  onChange={(e) => {
                    const formatted = formatEcuadorianPhone(e.target.value);
                    setWhatsappNumber(formatted);
                    if (errors.whatsappNumber) {
                      setErrors((prev) => ({ ...prev, whatsappNumber: '' }));
                    }
                  }}
                  placeholder="099 123 4567"
                  className={`w-full text-base sm:text-lg px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 ${
                    errors.whatsappNumber ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                  }`}
                />
                {errors.whatsappNumber ? (
                  <p className="text-xs text-red-600 font-bold">{errors.whatsappNumber}</p>
                ) : (
                  <p className="text-[11px] text-slate-500 font-medium">10 dígitos • Empieza con 09</p>
                )}
              </div>

              {/* Correo electrónico */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-800 block">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full text-base px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Selectores de Tipo y Tarifa de Precios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-800 block">
                  Tipo
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/90">
                  {(['Hombre', 'Mujer', 'Otro'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      disabled={isOfficialDataLocked}
                      onClick={() => setGender(g)}
                      className={`py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${
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

              {/* Tarifa de Precios */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-800 block">
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
                      className={`py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${
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

            {/* Dirección */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                Dirección
              </label>
              <input
                type="text"
                value={addressReference}
                readOnly
                placeholder={isGeocoding ? 'Detectando dirección con Google Maps...' : 'Esperando señal GPS...'}
                className="w-full text-base px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-100/90 text-slate-800 font-medium cursor-not-allowed select-text leading-relaxed"
              />
            </div>

            {/* Mapa de Google Maps */}
            <div className="pt-1">
              <GoogleMapPreview
                latitude={coords.lat}
                longitude={coords.lng}
                accuracy={gpsAccuracy}
                isCalibrating={isCalibratingGps}
                zoom={17}
                className="h-44 sm:h-52 w-full rounded-2xl overflow-hidden shadow-2xs border border-slate-200"
              />
            </div>
          </div>

          {/* Sticky Docked Footer Bar - Limpio y Firme al fondo */}
          <div className="px-5 sm:px-7 py-3.5 sm:py-4 bg-white border-t border-slate-200/90 flex items-center justify-end space-x-3 gap-2 shrink-0 z-20">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-2xl text-sm sm:text-base font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-2xl text-sm sm:text-base font-bold shadow-xs transition-all cursor-pointer text-center"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
