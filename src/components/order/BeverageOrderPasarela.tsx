'use client';

import React, { useState, useMemo } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import {
  BeverageType,
  JavaProductOption,
  CartItem,
  SurtidoBreakdown,
} from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import confetti from 'canvas-confetti';
import {
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface BeverageOrderPasarelaProps {
  onGoToCheckout?: () => void;
}

// Minimalist vector SVG bottle silhouette
function BottleVectorIcon({
  size,
  container,
  isSelected,
}: {
  size: string;
  container: 'Plástico' | 'Vidrio';
  isSelected: boolean;
}) {
  const isGlass = container === 'Vidrio';
  const isLarge = size.includes('1.5') || size.includes('3.0') || size.includes('1500') || size.includes('3000') || size.includes('1 Litro') || size.includes('1L') || size.includes('1000');
  const isMedium = size.includes('500') || size.includes('550') || size.includes('600');

  const strokeColor = isSelected ? '#2563eb' : '#64748b';
  const fillColor = isSelected ? '#dbeafe' : '#f1f5f9';

  return (
    <svg
      viewBox="0 0 24 44"
      className="w-full h-full max-h-11 transition-all"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cap */}
      <rect
        x={isLarge ? "9" : "9.5"}
        y="1"
        width={isLarge ? "6" : "5"}
        height="3"
        rx="1"
        fill={strokeColor}
      />
      {/* Neck */}
      <path
        d={
          isGlass
            ? "M10 4 H14 V12 L17 17 V40 C17 41.5 15.5 43 14 43 H10 C8.5 43 7 41.5 7 40 V17 L10 12 Z"
            : isLarge
            ? "M9.5 4 H14.5 V10 L19 16 V40 C19 41.5 17.5 43 15.5 43 H8.5 C6.5 43 5 41.5 5 40 V16 L9.5 10 Z"
            : isMedium
            ? "M10 4 H14 V11 L18 17 V39 C18 41 16.5 42.5 15 42.5 H9 C7.5 42.5 6 41 6 39 V17 L10 11 Z"
            : "M10 4 H14 V12 L17 18 V38 C17 40.5 15.5 42 13.5 42 H10.5 C8.5 42 7 40.5 7 38 V18 L10 12 Z"
        }
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Texture rings */}
      <line
        x1={isLarge ? "8" : "9"}
        y1={isLarge ? "24" : "25"}
        x2={isLarge ? "16" : "15"}
        y2={isLarge ? "24" : "25"}
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeOpacity="0.4"
      />
      <line
        x1={isLarge ? "8" : "9"}
        y1={isLarge ? "31" : "32"}
        x2={isLarge ? "16" : "15"}
        y2={isLarge ? "31" : "32"}
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeOpacity="0.4"
      />
    </svg>
  );
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

  // Sabor o Surtido
  const [flavorMode, setFlavorMode] = useState<'single' | 'surtido'>('single');
  const [selectedSingleFlavor, setSelectedSingleFlavor] = useState<string>('Piña');
  const [surtidoCounts, setSurtidoCounts] = useState<SurtidoBreakdown>({});

  React.useEffect(() => {
    if (currentOption) {
      const flavors = currentOption.allowedFlavors;
      setSelectedSingleFlavor(flavors[0] || 'Piña');

      const totalUnits = currentOption.unitsPerJava;
      const initialSurtido: SurtidoBreakdown = {};
      if (flavors.length > 1) {
        const perFlavor = Math.floor(totalUnits / flavors.length);
        const remainder = totalUnits % flavors.length;
        flavors.forEach((fl, idx) => {
          initialSurtido[fl] = perFlavor + (idx < remainder ? 1 : 0);
        });
      } else {
        initialSurtido[flavors[0]] = totalUnits;
      }
      setSurtidoCounts(initialSurtido);

      if (flavors.length <= 1) {
        setFlavorMode('single');
      }
    }
  }, [currentOption]);

  // VENTA MIXTA: Javas y Unidades Sueltas (inician en 0 para exigir confirmación con +)
  const [javasCount, setJavasCount] = useState<number>(0);
  const [unitsCount, setUnitsCount] = useState<number>(0);

  const resetQuantities = () => {
    setJavasCount(0);
    setUnitsCount(0);
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

  const handleFlavorModeChange = (mode: 'single' | 'surtido') => {
    if (mode !== flavorMode) {
      setFlavorMode(mode);
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

  // Cálculo de Precio Unitario
  const unitPrice = useMemo(() => {
    if (!currentOption) return 0;
    return currentOption.pricePerUnit || Number((effectivePricePerJava / currentOption.unitsPerJava).toFixed(2));
  }, [currentOption, effectivePricePerJava]);

  // Subtotal Actual Dinámico
  const currentTotalSubtotal = useMemo(() => {
    if (!currentOption) return 0;
    const javasVal = javasCount * effectivePricePerJava;
    const unitsVal = unitsCount * unitPrice;
    return Number((javasVal + unitsVal).toFixed(2));
  }, [currentOption, javasCount, unitsCount, effectivePricePerJava, unitPrice]);

  const currentTotalBottles = useMemo(() => {
    if (!currentOption) return 0;
    return (javasCount * currentOption.unitsPerJava) + unitsCount;
  }, [currentOption, javasCount, unitsCount]);

  // Surtido validación
  const totalSurtidoUnits = useMemo(() => {
    return Object.values(surtidoCounts).reduce((sum, n) => sum + (n || 0), 0);
  }, [surtidoCounts]);

  const targetUnits = currentOption?.unitsPerJava || 12;
  const isSurtidoValid = flavorMode === 'single' || totalSurtidoUnits === targetUnits;
  const canAddToCart = isSurtidoValid && (javasCount > 0 || unitsCount > 0);

  const handleSurtidoCountChange = (flavor: string, delta: number) => {
    const currentVal = surtidoCounts[flavor] || 0;
    const newVal = Math.max(0, currentVal + delta);
    setSurtidoCounts((prev) => ({
      ...prev,
      [flavor]: newVal,
    }));
  };

  const handleEqualizeSurtido = () => {
    if (!currentOption) return;
    const flavors = currentOption.allowedFlavors;
    const totalUnits = currentOption.unitsPerJava;
    const perFlavor = Math.floor(totalUnits / flavors.length);
    const remainder = totalUnits % flavors.length;
    const resetSurtido: SurtidoBreakdown = {};
    flavors.forEach((fl, idx) => {
      resetSurtido[fl] = perFlavor + (idx < remainder ? 1 : 0);
    });
    setSurtidoCounts(resetSurtido);
  };

  const handleAddToCart = () => {
    if (!currentOption || !canAddToCart) return;

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productOptionId: currentOption.id,
      brand: currentOption.brand || 'Fructi',
      beverageType: currentOption.beverageType,
      container: currentOption.container,
      size: currentOption.size,
      flavorType: flavorMode,
      selectedFlavor: flavorMode === 'single' ? selectedSingleFlavor : undefined,
      surtidoDetails: flavorMode === 'surtido' ? surtidoCounts : undefined,
      quantityJavas: javasCount,
      quantityUnits: unitsCount,
      unitsPerJava: currentOption.unitsPerJava,
      pricePerJava: effectivePricePerJava,
      pricePerUnit: unitPrice,
      totalBottles: currentTotalBottles,
      subtotal: currentTotalSubtotal,
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
        <div className="flex items-center space-x-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
          {availableTypes.map((type) => {
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-base sm:text-lg transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
        <div className="p-8 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700">No hay productos registrados en {selectedType}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Category Pills Header */}
      <div className="flex items-center space-x-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
        {availableTypes.map((type) => {
          const isSelected = selectedType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-base sm:text-lg transition-all active:scale-95 ${
                isSelected
                  ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          );
        })}
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
              <span className="text-xs text-slate-500 font-bold">Tamaño • Unidades • Valor</span>
            </div>

            {/* Grid compacto de mini-tiles horizontales */}
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
                    className={`relative p-3 rounded-2xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Bottle Icon */}
                    <div className={`w-8 h-10 rounded-xl flex items-center justify-center p-0.5 flex-shrink-0 ${
                      isSelected ? 'bg-white shadow-2xs' : 'bg-slate-50'
                    }`}>
                      <BottleVectorIcon
                        size={option.size}
                        container={option.container}
                        isSelected={isSelected}
                      />
                    </div>

                    {/* Content on the right */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                        {displayTitle}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        {option.unitsPerJava} unidades
                      </div>
                      <div className="text-sm sm:text-base font-black text-blue-700 font-mono">
                        {formatCurrency(optPrice)}
                      </div>
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

                {currentOption.allowedFlavors.length > 1 && (
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleFlavorModeChange('single')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all active:scale-95 ${
                        flavorMode === 'single'
                          ? 'bg-white text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sabor Único
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlavorModeChange('surtido')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all active:scale-95 ${
                        flavorMode === 'surtido'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Java Surtida
                    </button>
                  </div>
                )}
              </div>

              {flavorMode === 'single' ? (
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
                        className={`p-2 sm:p-2.5 rounded-2xl border text-center flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2.5 transition-all active:scale-[0.97] group ${
                          isSelected
                            ? `${style.bgSelected} ${style.borderSelected} ${style.ringSelected} shadow-sm`
                            : 'border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 shadow-2xs'
                        }`}
                      >
                        {/* 3D Fruit Icon o espacio en blanco si no tiene icono definido */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 p-1 ${
                          hasFlavorGraphic
                            ? 'bg-white shadow-2xs border border-slate-100'
                            : 'bg-white/50 border border-slate-200/60'
                        }`}>
                          {hasFlavorGraphic ? <FruitVectorIcon flavor={flavor} size={32} /> : null}
                        </div>

                        <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">
                          {flavor}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Constructor de Surtido */
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-slate-900 text-sm">
                      Asigna botellas por sabor • {currentOption.unitsPerJava} unidades
                    </span>
                    <button
                      type="button"
                      onClick={handleEqualizeSurtido}
                      className="text-blue-700 hover:underline flex items-center font-black text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Repartir equitativo
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentOption.allowedFlavors.map((flavor) => {
                      const count = surtidoCounts[flavor] || 0;
                      const hasFlavorGraphic = Boolean(FLAVOR_ICON_URLS[flavor] || flavor === 'Sin Gas' || flavor === 'Con Gas');

                      return (
                        <div
                          key={flavor}
                          className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 p-1 ${
                              hasFlavorGraphic
                                ? 'bg-slate-50 border border-slate-100 shadow-2xs'
                                : 'bg-white/50 border border-slate-200/60'
                            }`}>
                              {hasFlavorGraphic ? <FruitVectorIcon flavor={flavor} size={30} /> : null}
                            </div>
                            <span className="font-black text-sm sm:text-base text-slate-900">{flavor}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleSurtidoCountChange(flavor, -1)}
                              disabled={count <= 0}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center font-black disabled:opacity-30 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center font-mono font-black text-base text-slate-900">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSurtidoCountChange(flavor, 1)}
                              disabled={totalSurtidoUnits >= targetUnits}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center font-black disabled:opacity-30 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className={`text-xs sm:text-sm p-3 rounded-xl border flex items-center justify-between font-black ${
                      isSurtidoValid
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                        : 'bg-amber-50 text-amber-950 border-amber-300'
                    }`}
                  >
                    <span>
                      {totalSurtidoUnits} de {targetUnits} botellas asignadas
                    </span>
                    {!isSurtidoValid && (
                      <span className="text-xs font-bold">
                        {targetUnits > totalSurtidoUnits
                          ? `Faltan ${targetUnits - totalSurtidoUnits}`
                          : `Sobran ${totalSurtidoUnits - targetUnits}`}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: VENTA MIXTA (JAVAS + UNIDADES SUELTAS) Y PRECIO DINÁMICO */}
          {currentOption && (
            <div className="pt-3.5 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/90 p-3 sm:p-4 rounded-2xl border border-slate-200/90">
                {/* Total Price Display */}
                <div>
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="text-xs font-bold text-slate-500">Precio Total:</span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {currentTotalBottles} {currentTotalBottles === 1 ? 'botella' : 'botellas'}
                    </span>
                    {clientTier === 'distribuidor' && (
                      <span className="text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-md">
                        Tarifa Distribuidor
                      </span>
                    )}
                    {clientTier === 'especial' && (
                      <span className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                        Tarifa Especial
                      </span>
                    )}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-0.5">
                    {javasCount === 0 && unitsCount === 0 ? '$0.00' : formatCurrency(currentTotalSubtotal)}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                    {javasCount > 0 && `${javasCount} ${javasCount === 1 ? (currentOption?.container === 'Vidrio' ? 'Java' : 'Pack') : (currentOption?.container === 'Vidrio' ? 'Javas' : 'Packs')}`}
                    {javasCount > 0 && unitsCount > 0 && ' + '}
                    {unitsCount > 0 && `${unitsCount} ${unitsCount === 1 ? 'Unidad suelta' : 'Unidades sueltas'}`}
                    {javasCount === 0 && unitsCount === 0 && 'Indica la cantidad deseada'}
                  </div>
                </div>

                {/* Dual Stepper Pills: Javas/Packs & Unidades */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  {/* Javas / Packs Pill */}
                  <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-xs font-black text-slate-700 px-1">
                      {currentOption?.container === 'Vidrio' ? 'Javas:' : 'Packs:'}
                    </span>
                    <button
                      type="button"
                      disabled={javasCount <= 0}
                      onClick={() => setJavasCount((c) => Math.max(0, c - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 transition-colors font-black"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-black font-mono text-sm sm:text-base text-slate-900">
                      {javasCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setJavasCount((c) => c + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center hover:bg-slate-200 transition-colors font-black"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Loose Units Pill */}
                  <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-xs font-black text-slate-700 px-1">Unidades:</span>
                    <button
                      type="button"
                      disabled={unitsCount <= 0}
                      onClick={() => setUnitsCount((c) => Math.max(0, c - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 transition-colors font-black"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-black font-mono text-sm sm:text-base text-slate-900">
                      {unitsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setUnitsCount((c) => c + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center hover:bg-slate-200 transition-colors font-black"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CTA: Agregar al Pedido */}
              <button
                type="button"
                disabled={!canAddToCart}
                onClick={handleAddToCart}
                className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center space-x-2 transition-all ${
                  canAddToCart
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                }`}
              >
                {canAddToCart && <Plus className="w-5 h-5" />}
                <span>
                  {canAddToCart
                    ? `Agregar al Pedido • ${formatCurrency(currentTotalSubtotal)}`
                    : 'Agregar al Pedido'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
