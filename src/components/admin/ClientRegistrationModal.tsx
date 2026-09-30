'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { Gender, Client, ClientTier } from '@/types';
import {
  X,
  Search,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  ApplePersonBadgePlusIcon,
  ApplePencilIcon,
  AppleMapPinIcon,
} from '@/components/ui/AppleIcons';
import {
  formatEcuadorianPhone,
  validateEcuadorianPhone,
  validateEcuadorianCedula,
  validateEcuadorianRuc,
} from '@/lib/utils/ecuadorValidators';

interface ClientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: (client: Client) => void;
  initialCoords?: { latitude: number; longitude: number };
  clientToEdit?: Client | null;
}

export function ClientRegistrationModal({
  isOpen,
  onClose,
  onClientCreated,
  initialCoords,
  clientToEdit,
}: ClientRegistrationModalProps) {
  const { clients, addClient, updateClient } = useDistribution();

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  // Initialize or reset form based on clientToEdit and isOpen
  useEffect(() => {
    if (!isOpen) return;

    if (clientToEdit) {
      setFullName(clientToEdit.fullName || '');
      setBusinessName(clientToEdit.businessName || '');
      setGender(clientToEdit.gender || 'Hombre');
      setWhatsappNumber(clientToEdit.whatsappNumber || '');
      setBirthDate(clientToEdit.birthDate || '');
      setCoords({ lat: clientToEdit.latitude, lng: clientToEdit.longitude });
      setTaxId(clientToEdit.taxId || '');
      setTaxIdType((clientToEdit.taxIdType as '04' | '05') || (clientToEdit.taxId?.length === 13 ? '04' : '05'));
      setEmail(clientToEdit.email || '');
      setClientTier(clientToEdit.clientTier || 'normal');
      setAddressReference(clientToEdit.addressReference || '');
      setErrors({});
      setApiFeedback(null);
      setIsOfficialDataLocked(false);
      setIsCalibratingGps(false);
    } else {
      setFullName('');
      setBusinessName('');
      setGender('Hombre');
      setWhatsappNumber('');
      setBirthDate('');
      setCoords({
        lat: initialCoords?.latitude ?? -1.24908,
        lng: initialCoords?.longitude ?? -78.61675,
      });
      setTaxId('');
      setTaxIdType('05');
      setEmail('');
      setClientTier('normal');
      setAddressReference('');
      setErrors({});
      setApiFeedback(null);
      setIsOfficialDataLocked(false);
    }
  }, [isOpen, clientToEdit, initialCoords]);

  // Continuous GPS auto-refinement in real-time (no buttons needed, only for new registration)
  useEffect(() => {
    if (!isOpen || clientToEdit) return;

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
        if (data.gender) setGender(data.gender === 'Empresa' || data.gender === 'Otro' ? 'Otro' : data.gender);
        if (data.taxIdType) setTaxIdType(data.taxIdType === '04' ? '04' : '05');
        if (data.addressReference && (!addressReference || addressReference.length < 5)) {
          setAddressReference(data.addressReference);
        }
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

  const cleanTaxId = taxId.replace(/\D/g, '');
  const currentLength = cleanTaxId.length;

  // Detección proactiva de RUC de Empresa (3er dígito 6 o 9, o longitud de 13 dígitos)
  const isCompanyFormat = currentLength >= 3 && (cleanTaxId[2] === '9' || cleanTaxId[2] === '6');
  const isExplicitRuc = taxIdType === '04' || currentLength === 13 || isCompanyFormat;
  const isCedula = !isExplicitRuc;
  const expectedLength = isExplicitRuc ? 13 : 10;

  // Validación sin bloquear: si tiene 13 dígitos valida RUC, si tiene 10 cédula
  const taxValidation = isExplicitRuc
    ? (currentLength === 13
        ? validateEcuadorianRuc(cleanTaxId)
        : {
            isValid: false,
            type: '04' as const,
            cleanDigits: cleanTaxId,
            error: isCompanyFormat
              ? `RUC de empresa (${currentLength}/13 dígitos)`
              : `RUC (${currentLength}/13 dígitos)`,
          })
    : validateEcuadorianCedula(cleanTaxId);

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir ingresar o pegar hasta 13 dígitos directamente
    const raw = e.target.value.replace(/\D/g, '').slice(0, 13);
    setTaxId(raw);
    if (apiFeedback) setApiFeedback(null);

    // Auto-conmutar a RUC si escribe más de 10 dígitos o si el 3er dígito es 9 o 6
    if (raw.length > 10 || (raw.length >= 3 && (raw[2] === '9' || raw[2] === '6'))) {
      if (taxIdType !== '04') {
        setTaxIdType('04');
      }
    }
  };

  const handleRefreshGps = () => {
    if (navigator.geolocation) {
      setIsCalibratingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          setCoords({ lat: newLat, lng: newLng });
          setGpsAccuracy(pos.coords.accuracy);
          setIsCalibratingGps(false);
          fetchGoogleAddress(newLat, newLng);
        },
        (err) => {
          setIsCalibratingGps(false);
          alert('Error al obtener GPS: ' + err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    setIsSubmitting(true);

    try {
      if (clientToEdit) {
        const updated: Client = {
          ...clientToEdit,
          fullName,
          businessName: businessName.trim() || fullName,
          gender,
          clientTier,
          whatsappNumber: formattedPhone,
          latitude: coords.lat,
          longitude: coords.lng,
          addressReference: addressReference.trim(),
          taxId: taxId.trim() || undefined,
          taxIdType: (taxId.trim().replace(/\D/g, '').length === 13 || isExplicitRuc) ? '04' : taxIdType,
          email: email.trim() || undefined,
          birthDate: birthDate || undefined,
        };
        updateClient(updated);
        onClose();
        return;
      }

      const created = await addClient({
        fullName,
        businessName: businessName.trim() || fullName,
        gender,
        clientTier,
        whatsappNumber: formattedPhone,
        latitude: coords.lat,
        longitude: coords.lng,
        addressReference: addressReference.trim(),
        taxId: taxId.trim() || undefined,
        taxIdType: (taxId.trim().replace(/\D/g, '').length === 13 || isExplicitRuc) ? '04' : taxIdType,
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
    } catch (err: any) {
      alert('Error al registrar el local: ' + (err?.message || 'Error de conexión'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[94vh] sm:max-h-[88vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Mobile Drag Indicator Bar */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden bg-slate-50/90">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header Bar */}
        <div className="bg-slate-50/90 border-b border-slate-200/90 px-5 sm:px-7 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              {clientToEdit ? (
                <ApplePencilIcon size={20} className="brightness-0 invert" alt="Editar" />
              ) : (
                <ApplePersonBadgePlusIcon size={22} className="brightness-0 invert" alt="Nuevo Local" />
              )}
            </div>
            <h2 className="font-black text-lg sm:text-xl text-slate-900 leading-tight">
              {clientToEdit ? 'Modificar Local' : 'Registro de Local'}
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
            <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-sm sm:text-base font-black text-slate-900 block">
                  Cédula o RUC
                </label>

                {/* Document Type Pills */}
                <div className="flex items-center bg-slate-200/90 p-1 rounded-xl text-xs sm:text-sm font-black border border-slate-300/70">
                  <button
                    type="button"
                    onClick={() => {
                      setTaxIdType('05');
                      if (taxId.length > 10) setTaxId(taxId.slice(0, 10));
                    }}
                    className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                      taxIdType === '05' && !isCompanyFormat
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
                      taxIdType === '04' || isCompanyFormat
                        ? 'bg-white text-blue-700 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    RUC
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={13}
                    value={taxId}
                    disabled={isOfficialDataLocked}
                    onChange={handleTaxIdChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (currentLength === 10 || currentLength === 13) handleLookup();
                      }
                    }}
                    placeholder={
                      isCompanyFormat
                        ? 'RUC Empresa (13 dígitos)'
                        : isExplicitRuc
                        ? 'RUC (13 dígitos)'
                        : 'Cédula (10 dígitos) o RUC'
                    }
                    className={`w-full text-base px-4 pr-14 py-3 bg-white border rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden transition-all ${
                      isOfficialDataLocked
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : taxValidation.isValid
                        ? 'border-emerald-500 focus:border-emerald-600 text-slate-900 font-bold'
                        : currentLength === expectedLength && !taxValidation.isValid
                        ? 'border-rose-400 focus:border-rose-500 text-rose-900 font-bold'
                        : 'border-slate-300 text-slate-900 font-bold placeholder:font-normal'
                    }`}
                  />

                  {/* Badge de Conteo */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 pointer-events-none">
                    <span
                      className={`text-xs font-mono font-black ${
                        taxValidation.isValid
                          ? 'text-emerald-600'
                          : currentLength === expectedLength && !taxValidation.isValid
                          ? 'text-rose-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {currentLength}/{expectedLength}
                    </span>
                  </div>
                </div>

                {isOfficialDataLocked ? (
                  <button
                    type="button"
                    onClick={() => setIsOfficialDataLocked(false)}
                    className="h-12 px-4 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 rounded-xl text-sm font-black transition-all shrink-0 cursor-pointer flex items-center justify-center"
                    title="Desbloquear para editar número"
                  >
                    Cambiar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={isSearchingApi || (currentLength !== 10 && currentLength !== 13)}
                    className="h-12 w-12 sm:w-auto sm:px-4 shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                    title={
                      currentLength === 10 || currentLength === 13
                        ? 'Consultar en SRI / Registro Civil'
                        : 'Ingresa los 10 dígitos de Cédula o 13 del RUC para consultar'
                    }
                  >
                    {isSearchingApi ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5 stroke-[2.5]" />
                    )}
                    <span className="hidden sm:inline font-bold text-sm">
                      {isSearchingApi ? 'Consultando...' : 'Consultar'}
                    </span>
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

              {/* Notificación proactiva si la Cédula/RUC ya tiene un local previo registrado */}
              {!clientToEdit && taxId.replace(/\D/g, '').length >= 10 && (() => {
                const cleanTax = taxId.replace(/\D/g, '');
                const existing = clients.filter(c => c.taxId && c.taxId.replace(/\D/g, '') === cleanTax);
                if (existing.length === 0) return null;
                return (
                  <div className="p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-800 flex items-start gap-2 animate-in fade-in duration-150">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Cédula / RUC ya registrado:</span> Ya existe el local{' '}
                      <span className="font-bold underline">{existing[0].businessName || existing[0].fullName}</span>.
                      Este nuevo registro se guardará como sucursal adicional con ruta y código QR independientes.
                    </div>
                  </div>
                );
              })()}
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
                  placeholder="099 123 4567 (Opcional)"
                  className={`w-full text-base sm:text-lg px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 ${
                    errors.whatsappNumber ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                  }`}
                />
                {errors.whatsappNumber ? (
                  <p className="text-xs sm:text-sm text-red-600 font-bold">{errors.whatsappNumber}</p>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">10 dígitos • Empieza con 09 (Opcional)</p>
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

            {/* Ubicación del Local (Apple Design Minimalista) */}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <AppleMapPinIcon size={18} alt="Ubicación" />
                  <label className="text-sm sm:text-base font-black text-slate-900 truncate">
                    Ubicación del Local
                  </label>

                  {/* Badge de Precisión Satelital */}
                  {isCalibratingGps ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-2xs font-bold animate-pulse shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping mr-0.5" />
                      <span>Sintonizando...</span>
                    </span>
                  ) : isGeocoding ? (
                    <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-2xs font-bold shrink-0">
                      <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      <span>Obteniendo calle...</span>
                    </span>
                  ) : gpsAccuracy !== null ? (
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-2xs font-black shrink-0 ${
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
                      <span>±{Math.round(gpsAccuracy)} m de precisión</span>
                    </span>
                  ) : null}
                </div>

                {/* Botón sutil de Refrescar GPS */}
                <button
                  type="button"
                  onClick={handleRefreshGps}
                  disabled={isCalibratingGps || isGeocoding}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 active:scale-95 disabled:opacity-50 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0 shadow-2xs"
                  title="Actualizar ubicación satelital"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCalibratingGps ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
                  <span>{isCalibratingGps ? 'Detectando...' : 'Refrescar'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={addressReference}
                  onChange={(e) => setAddressReference(e.target.value)}
                  placeholder="Dirección del local (obtenida con Google Maps)..."
                  className="w-full text-sm sm:text-base px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 shadow-2xs"
                />
                <p className="text-xs text-slate-500">
                  Se autocompleta con tu GPS mediante Google Maps. Puedes editarla o agregar referencias.
                </p>
              </div>
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
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white rounded-2xl text-sm sm:text-base font-bold shadow-xs transition-all cursor-pointer text-center flex items-center justify-center space-x-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{clientToEdit ? 'Guardar Cambios' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
