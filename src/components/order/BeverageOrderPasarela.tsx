'use client';

import React, { useState, useMemo } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import {
  BeverageType,
  JavaProductOption,
  CartItem,
} from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AppleWaterBottleIcon,
  ApplePlusIcon,
  AppleMinusIcon,
} from '@/components/ui/AppleIcons';

interface BeverageOrderPasarelaProps {
  onGoToCheckout?: () => void;
}

const FLAVOR_ICON_URLS: Record<string, string> = {
  'Piña': '/flavors/pina.webp',
  'Mora': '/flavors/mora.webp',
  'Mandarina': '/flavors/mandarina.webp',
  'Uva': '/flavors/uva.webp',
  'Tamarindo': '/flavors/tamarindo.webp',
  'Lima Limón': '/flavors/lima-limon.webp',
  'Flor de Jamaica': '/flavors/flor-de-jamaica.webp',
};

// 3D & Vector fruit icon for flavors
function FruitVectorIcon({ flavor, size = 28, className = "" }: { flavor: string; size?: number; className?: string }) {
  const iconUrl = FLAVOR_ICON_URLS[flavor];
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={flavor}
        width={size}
        height={size}
        className={`object-contain select-none pointer-events-none drop-shadow-xs transition-transform duration-200 group-hover:scale-110 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        loading="eager"
      />
    );
  }

  if (flavor === 'Sin Gas') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 3C12 3 6 10 6 15C6 18.3 8.7 21 12 21C15.3 21 18 18.3 18 15C18 10 12 3 12 3Z" fill="#38bdf8" />
        <ellipse cx="10" cy="14" rx="1.5" ry="3" fill="#e0f2fe" opacity="0.8" />
      </svg>
    );
  }

  if (flavor === 'Con Gas') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 3C12 3 6 10 6 15C6 18.3 8.7 21 12 21C15.3 21 18 18.3 18 15C18 10 12 3 12 3Z" fill="#0284c7" />
        <circle cx="10" cy="16" r="1.5" fill="#ffffff" />
        <circle cx="14" cy="13" r="1" fill="#ffffff" />
        <circle cx="11" cy="10" r="0.8" fill="#ffffff" />
      </svg>
    );
  }

  // Si no existe icono para este sabor, se deja en blanco (sin inventar iconos)
  return null;
}

const DEFAULT_FLAVOR_STYLE = {
  bgSelected: 'bg-blue-50/90',
  borderSelected: 'border-blue-600',
  ringSelected: 'ring-2 ring-blue-500/25',
};

const FLAVOR_STYLES: Record<string, { bgSelected: string; borderSelected: string; ringSelected: string }> = {
  'Piña': { bgSelected: 'bg-amber-50/90', borderSelected: 'border-amber-500', ringSelected: 'ring-2 ring-amber-400/25' },
  'Tamarindo': { bgSelected: 'bg-amber-100/90', borderSelected: 'border-amber-700', ringSelected: 'ring-2 ring-amber-600/25' },
  'Mora': { bgSelected: 'bg-purple-50/90', borderSelected: 'border-purple-600', ringSelected: 'ring-2 ring-purple-500/25' },
  'Uva': { bgSelected: 'bg-violet-50/90', borderSelected: 'border-violet-600', ringSelected: 'ring-2 ring-violet-500/25' },
  'Mandarina': { bgSelected: 'bg-orange-50/90', borderSelected: 'border-orange-500', ringSelected: 'ring-2 ring-orange-400/25' },
  'Sin Gas': { bgSelected: 'bg-sky-50/90', borderSelected: 'border-sky-500', ringSelected: 'ring-2 ring-sky-400/25' },
  'Con Gas': { bgSelected: 'bg-blue-50/90', borderSelected: 'border-blue-600', ringSelected: 'ring-2 ring-blue-500/25' },
  'Lima Limón': { bgSelected: 'bg-lime-50/90', borderSelected: 'border-lime-500', ringSelected: 'ring-2 ring-lime-400/25' },
  'Flor de Jamaica': { bgSelected: 'bg-rose-50/90', borderSelected: 'border-rose-600', ringSelected: 'ring-2 ring-rose-500/25' },
};

export function BeverageOrderPasarela({ onGoToCheckout }: BeverageOrderPasarelaProps) {
  const { catalog, addToCart, clients, selectedClientId } = useDistribution();

  // Active Client & Pricing Tier (Normal / Distribuidor / Especial)
  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  const clientTier = activeClient?.clientTier || 'normal';

  // Categorías de bebidas derivadas 100% del catálogo en base de datos
  const availableTypes = useMemo(() => {
    const presentTypes = Array.from(new Set(catalog.map((opt) => opt.beverageType)));
    const preferredOrder: BeverageType[] = ['Colas', 'Aguas', 'Tés'];
    const ordered = preferredOrder.filter((t) => presentTypes.includes(t));
    const remaining = presentTypes.filter((t) => !preferredOrder.includes(t as BeverageType));
    return (ordered.length > 0 || remaining.length > 0)
      ? ([...ordered, ...remaining] as BeverageType[])
      : (['Colas', 'Aguas', 'Tés'] as BeverageType[]);
  }, [catalog]);

  // Tipo de Bebida
  const [selectedType, setSelectedType] = useState<BeverageType>('Colas');

  // Asegurar selección válida cuando se carga o actualiza el catálogo
  React.useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.includes(selectedType)) {
      setSelectedType(availableTypes[0]);
    }
  }, [availableTypes, selectedType]);

  const availableOptionsForType = useMemo(() => {
    return catalog.filter((opt) => opt.beverageType === selectedType);
  }, [catalog, selectedType]);

  // Formato seleccionado
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');

  // Asegurar selección válida cuando cambia la categoría o se actualiza el catálogo
  React.useEffect(() => {
    if (availableOptionsForType.length > 0) {
      const exists = availableOptionsForType.some((o) => o.id === selectedOptionId);
      if (!exists) {
        setSelectedOptionId(availableOptionsForType[0].id);
      }
    }
  }, [availableOptionsForType, selectedOptionId]);

  const currentOption = useMemo<JavaProductOption | undefined>(() => {
    return catalog.find((opt) => opt.id === selectedOptionId) || availableOptionsForType[0];
  }, [catalog, selectedOptionId, availableOptionsForType]);

  // Selección de Sabor (Único)
  const [selectedSingleFlavor, setSelectedSingleFlavor] = useState<string>('Piña');

  React.useEffect(() => {
    if (currentOption) {
      const flavors = currentOption.allowedFlavors;
      setSelectedSingleFlavor(flavors[0] || 'Piña');
    }
  }, [currentOption]);

  // VENTA MIXTA: Javas y Unidades Sueltas (inician en 0 para exigir confirmación con +)
  const [javasCount, setJavasCount] = useState<number>(0);
  const [unitsCount, setUnitsCount] = useState<number>(0);
  const [conversionNotice, setConversionNotice] = useState<string | null>(null);

  const resetQuantities = () => {
    setJavasCount(0);
    setUnitsCount(0);
    setConversionNotice(null);
  };

  const handleTypeChange = (type: BeverageType) => {
    if (type !== selectedType) {
      setSelectedType(type);
      resetQuantities();
    }
  };

  const handleOptionChange = (optionId: string) => {
    if (optionId !== selectedOptionId) {
      setSelectedOptionId(optionId);
      resetQuantities();
    }
  };

  const handleFlavorChange = (flavor: string) => {
    if (flavor !== selectedSingleFlavor) {
      setSelectedSingleFlavor(flavor);
      resetQuantities();
    }
  };

  // Precio por Java adaptado a la categoría del cliente
  const effectivePricePerJava = useMemo(() => {
    if (!currentOption) return 0;
    if (clientTier === 'distribuidor' && currentOption.priceDistribuidor) {
      return currentOption.priceDistribuidor;
    }
    if (clientTier === 'especial' && currentOption.priceEspecial) {
      return currentOption.priceEspecial;
    }
    return currentOption.pricePerJava;
  }, [currentOption, clientTier]);

  // Cálculo de Precio Unitario con precisión contable de hasta 4 decimales (SRI)
  const unitPrice = useMemo(() => {
    if (!currentOption) return 0;
    return currentOption.pricePerUnit || Number((effectivePricePerJava / currentOption.unitsPerJava).toFixed(4));
  }, [currentOption, effectivePricePerJava]);

  // Subtotal Actual Dinámico con auto-conversión si las unidades completan paquetes
  const currentTotalSubtotal = useMemo(() => {
    if (!currentOption) return 0;
    const extraJavas = Math.floor(unitsCount / currentOption.unitsPerJava);
    const effectiveUnits = unitsCount % currentOption.unitsPerJava;
    const effectiveJavas = javasCount + extraJavas;

    const javasVal = effectiveJavas * effectivePricePerJava;
    const unitsVal = effectiveUnits * unitPrice;
    return Number((javasVal + unitsVal).toFixed(2));
  }, [currentOption, javasCount, unitsCount, effectivePricePerJava, unitPrice]);

  const handleIncrementUnits = () => {
    if (!currentOption) return;
    const nextUnits = unitsCount + 1;
    if (nextUnits >= currentOption.unitsPerJava) {
      setJavasCount((prev) => prev + 1);
      setUnitsCount(0);
      const containerLabel = currentOption.container === 'Vidrio' ? 'Java' : 'Pack';
      setConversionNotice(`¡${currentOption.unitsPerJava} unidades convertidas automáticamente a 1 ${containerLabel}!`);
      setTimeout(() => setConversionNotice(null), 3500);
    } else {
      setUnitsCount(nextUnits);
    }
  };

  const canAddToCart = javasCount > 0 || unitsCount > 0;

  const handleAddToCart = () => {
    if (!currentOption || !canAddToCart) return;

    // Normalización: auto-convertir cualquier múltiplo completo de unidades a paquetes
    const extraJavas = Math.floor(unitsCount / currentOption.unitsPerJava);
    const finalUnits = unitsCount % currentOption.unitsPerJava;
    const finalJavas = javasCount + extraJavas;

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productOptionId: currentOption.id,
      brand: currentOption.brand || 'Fructi',
      beverageType: currentOption.beverageType,
      container: currentOption.container,
      size: currentOption.size,
      flavorType: 'single',
      selectedFlavor: selectedSingleFlavor,
      quantityJavas: finalJavas,
      quantityUnits: finalUnits,
      unitsPerJava: currentOption.unitsPerJava,
      pricePerJava: effectivePricePerJava,
      pricePerUnit: unitPrice,
      totalBottles: (finalJavas * currentOption.unitsPerJava) + finalUnits,
      subtotal: Number(((finalJavas * effectivePricePerJava) + (finalUnits * unitPrice)).toFixed(2)),
      imageUrl: currentOption.imageUrl,
    };

    addToCart(newItem);

    confetti({
      particleCount: 25,
      spread: 35,
      origin: { y: 0.85 },
    });

    // Reset counts back to 0
    resetQuantities();
  };

  if (catalog.length === 0) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-2">
        <p className="text-sm font-bold text-slate-700">Catálogo vacío en la base de datos</p>
        <p className="text-xs text-slate-500">Agrega productos en la tabla &apos;products&apos; de Supabase para visualizarlos aquí.</p>
      </div>
    );
  }

  if (availableOptionsForType.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Liquid Material Filter Pill (Contenida, tamaño normal) */}
        <div className="w-full">
          <div
            role="tablist"
            className="w-full grid p-1.5 bg-slate-200/80 border border-white/90 backdrop-blur-2xl rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            style={{ gridTemplateColumns: `repeat(${availableTypes.length}, minmax(0, 1fr))` }}
          >
            {availableTypes.map((type) => {
              const isActive = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTypeChange(type)}
                  className={`relative z-10 flex items-center justify-center py-2 px-2 sm:px-4 rounded-full transition-colors duration-200 outline-none select-none cursor-pointer text-center text-xs sm:text-[13px] font-black ${
                    isActive
                      ? 'text-slate-900'
                      : 'text-slate-500 hover:text-slate-800 font-bold'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="beverage-type-pill-empty"
                      className="absolute inset-0 bg-white shadow-[0_3px_12px_rgba(0,0,0,0.1)] border border-slate-200/80 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span>{type}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-8 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700">No hay productos registrados en {selectedType}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Liquid Material Filter Pill (Contenida, tamaño normal, exactamente como la del menú) */}
      <div className="w-full">
        <div
          role="tablist"
          className="w-full grid p-1.5 bg-slate-200/80 border border-white/90 backdrop-blur-2xl rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          style={{ gridTemplateColumns: `repeat(${availableTypes.length}, minmax(0, 1fr))` }}
        >
          {availableTypes.map((type) => {
            const isActive = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTypeChange(type)}
                className={`relative z-10 flex items-center justify-center py-2 px-2 sm:px-4 rounded-full transition-colors duration-200 outline-none select-none cursor-pointer text-center text-xs sm:text-[13px] font-black ${
                  isActive
                    ? 'text-slate-900'
                    : 'text-slate-500 hover:text-slate-800 font-bold'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="beverage-type-pill"
                    className="absolute inset-0 bg-white shadow-[0_3px_12px_rgba(0,0,0,0.1)] border border-slate-200/80 rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span>{type}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Order Card - Compact Speed-Order Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 space-y-5">
          {/* PASO 1: MINI-TILES HORIZONTALES EN 2 COLUMNAS (COMPACTAS Y VELOCES) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-black text-slate-900 flex items-center">
                <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center mr-2">
                  1
                </span>
                Elige el Tamaño
              </label>
              <span className="text-xs sm:text-sm text-slate-500 font-bold">Tamaño • Unidades • Valor</span>
            </div>

            {/* Grid compacto de tiles con estructura de 3 secciones: Ícono | Tamaño+Unidades | Precio */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {availableOptionsForType.map((option) => {
                let displayTitle: string = option.size;
                if (option.size === '1500 ml' || option.size === '1.5 Litros') displayTitle = '1.5 Litros';
                if (option.size === '3000 ml' || option.size === '3.0 Litros') displayTitle = '3.0 Litros';
                if (option.container === 'Vidrio') {
                  displayTitle = `${option.size} Vidrio`;
                }

                const isSelected = option.id === selectedOptionId;
                const optPrice = clientTier === 'distribuidor' && option.priceDistribuidor
                  ? option.priceDistribuidor
                  : (clientTier === 'especial' && option.priceEspecial ? option.priceEspecial : option.pricePerJava);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleOptionChange(option.id)}
                    className={`group relative p-2.5 sm:p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-2 sm:gap-2.5 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                    }`}
                  >
                    {/* 1. Izquierda: Ícono Water Bottle (outline por defecto, fill si está seleccionado) */}
                    <div className="shrink-0 flex items-center justify-center">
                      <AppleWaterBottleIcon
                        width={14}
                        height={30}
                        filled={isSelected}
                        className={`transition-transform duration-150 group-hover:scale-105 ${
                          isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                    </div>

                    {/* 2. En medio/Izquierda: Tamaño y Cantidad de botellas */}
                    <div className="min-w-0 flex-1 text-left pl-1 sm:pl-1.5">
                      <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                        {displayTitle}
                      </div>
                      <div className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate mt-0.5">
                        {option.unitsPerJava} unidades
                      </div>
                    </div>

                    {/* 3. Derecha: Precio con jerarquía visual destacada */}
                    <div className="shrink-0 text-right pl-0.5">
                      <span className={`text-base sm:text-lg font-black font-mono tracking-tight transition-colors ${
                        isSelected ? 'text-blue-600' : 'text-slate-900 group-hover:text-blue-600'
                      }`}>
                        {formatCurrency(optPrice)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PASO 2: ELIGE EL SABOR CON PÍLDORAS EN EL LATERAL DEL TÍTULO */}
          {currentOption && (
            <div className="space-y-2.5 pt-3.5 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <label className="text-base sm:text-lg font-black text-slate-900 flex items-center">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center mr-2">
                    2
                  </span>
                  Elige el Sabor
                </label>

              </div>

              <div className={`grid gap-2 ${
                currentOption.allowedFlavors.length <= 2 
                  ? 'grid-cols-2' 
                  : 'grid-cols-3 sm:grid-cols-5'
              }`}>
                {currentOption.allowedFlavors.map((flavor) => {
                  const isSelected = selectedSingleFlavor === flavor;
                  const style = FLAVOR_STYLES[flavor] || DEFAULT_FLAVOR_STYLE;
                  const hasFlavorGraphic = Boolean(FLAVOR_ICON_URLS[flavor] || flavor === 'Sin Gas' || flavor === 'Con Gas');

                  return (
                    <button
                      key={flavor}
                      type="button"
                      onClick={() => handleFlavorChange(flavor)}
                      className={`p-2 sm:p-2.5 rounded-2xl border text-center flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2.5 transition-all active:scale-[0.97] group cursor-pointer select-none ${
                        isSelected
                          ? `${style.bgSelected} ${style.borderSelected} ${style.ringSelected} shadow-sm`
                          : 'border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 shadow-2xs'
                      }`}
                    >
                      {/* 3D Fruit Icon directo sin recuadro */}
                      {hasFlavorGraphic ? (
                        <FruitVectorIcon flavor={flavor} size={34} className="shrink-0 drop-shadow-xs" />
                      ) : null}

                      <div className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                        {flavor}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 3: CANTIDAD, TOTAL Y AGREGAR */}
          {currentOption && (
            <div className="pt-3.5 border-t border-slate-100 space-y-3 sm:space-y-3.5">
              {/* 1. Botones de Packs/Javas y Unidades en dos filas simétricas a la misma altura */}
              <div className="space-y-2.5">
                {/* Fila 1: Javas / Packs */}
                <div className="flex items-center justify-between bg-white px-4 py-3 sm:py-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {currentOption?.container === 'Vidrio' ? 'Javas' : 'Packs'}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-400">
                      ({currentOption?.unitsPerJava} un.)
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      disabled={javasCount <= 0}
                      onClick={() => setJavasCount((c) => Math.max(0, c - 1))}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-95 disabled:opacity-25 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed select-none"
                      aria-label="Restar java"
                    >
                      <AppleMinusIcon size={16} className="text-slate-800" />
                    </button>
                    <span className="w-8 sm:w-9 text-center font-mono font-black text-xl sm:text-2xl text-slate-900 select-none">
                      {javasCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setJavasCount((c) => c + 1)}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 flex items-center justify-center transition-all shadow-xs cursor-pointer select-none"
                      aria-label="Sumar java"
                    >
                      <ApplePlusIcon size={16} className="text-white" />
                    </button>
                  </div>
                </div>

                {/* Fila 2: Unidades Sueltas */}
                <div className="flex items-center justify-between bg-white px-4 py-3 sm:py-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      Unidades
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      (máx. {(currentOption?.unitsPerJava || 12) - 1})
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      disabled={unitsCount <= 0}
                      onClick={() => setUnitsCount((c) => Math.max(0, c - 1))}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-95 disabled:opacity-25 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed select-none"
                      aria-label="Restar unidad"
                    >
                      <AppleMinusIcon size={16} className="text-slate-800" />
                    </button>
                    <span className="w-8 sm:w-9 text-center font-mono font-black text-xl sm:text-2xl text-slate-900 select-none">
                      {unitsCount}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrementUnits}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 flex items-center justify-center transition-all shadow-xs cursor-pointer select-none"
                      aria-label="Sumar unidad"
                    >
                      <ApplePlusIcon size={16} className="text-white" />
                    </button>
                  </div>
                </div>

                {conversionNotice && (
                  <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-sm">📦</span>
                    <span>{conversionNotice}</span>
                  </div>
                )}
              </div>

              {/* 2. Total a Pagar (después de los botones de packs y unidades) */}
              <div className="flex items-center justify-between bg-slate-50/90 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-200/90">
                <div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Total a Pagar
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight leading-none mt-1">
                    {javasCount === 0 && unitsCount === 0 ? '$0.00' : formatCurrency(currentTotalSubtotal)}
                  </div>
                </div>

                {/* Badges de tarifas si aplica */}
                <div className="flex items-center gap-1.5">
                  {clientTier === 'distribuidor' && (
                    <span className="text-xs font-black text-purple-700 bg-purple-100 border border-purple-200 px-3 py-1 rounded-xl">
                      Tarifa Distribuidor
                    </span>
                  )}
                  {clientTier === 'especial' && (
                    <span className="text-xs font-black text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-xl">
                      Tarifa Especial
                    </span>
                  )}
                </div>
              </div>

              {/* 3. CTA: Botón directo "Agregar" */}
              <button
                type="button"
                disabled={!canAddToCart}
                onClick={handleAddToCart}
                className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center space-x-2 transition-all select-none ${
                  canAddToCart
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                }`}
              >
                {canAddToCart && <ApplePlusIcon size={18} className="text-white mr-1.5" />}
                <span>Agregar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
