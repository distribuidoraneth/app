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
  const isLarge = size.includes('1.5') || size.includes('3.0') || size.includes('1500') || size.includes('3000');
  const isMedium = size.includes('500');

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

// Vector fruit SVG icon for flavors
function FruitVectorIcon({ flavor, size = 20, className = "" }: { flavor: string; size?: number; className?: string }) {
  switch (flavor) {
    case 'Piña':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 2L10 6H14L12 2Z" fill="#16a34a" />
          <path d="M9 5L6 8H10L9 5Z" fill="#22c55e" />
          <path d="M15 5L18 8H14L15 5Z" fill="#22c55e" />
          <ellipse cx="12" cy="15" rx="6" ry="7" fill="#f59e0b" />
          <path d="M8 12L16 18M16 12L8 18M12 9V21" stroke="#d97706" strokeWidth="1.2" />
        </svg>
      );
    case 'Tamarindo':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <ellipse cx="9" cy="8" rx="3.5" ry="3.5" fill="#92400e" />
          <ellipse cx="13" cy="13" rx="3.5" ry="3.5" fill="#92400e" />
          <ellipse cx="16" cy="18" rx="3" ry="3" fill="#b45309" />
          <path d="M9 5C12 9 14 14 17 20" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'Mora':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="8" r="2.5" fill="#7e22ce" />
          <circle cx="9" cy="12" r="2.5" fill="#6b21a8" />
          <circle cx="15" cy="12" r="2.5" fill="#6b21a8" />
          <circle cx="10" cy="16" r="2.5" fill="#581c87" />
          <circle cx="14" cy="16" r="2.5" fill="#581c87" />
          <circle cx="12" cy="19.5" r="2" fill="#3b0764" />
          <path d="M12 4V6M10 5L14 5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'Uva':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="10" cy="9" r="2.5" fill="#8b5cf6" />
          <circle cx="14" cy="9" r="2.5" fill="#8b5cf6" />
          <circle cx="8" cy="13.5" r="2.5" fill="#7c3aed" />
          <circle cx="12" cy="13.5" r="2.5" fill="#7c3aed" />
          <circle cx="16" cy="13.5" r="2.5" fill="#7c3aed" />
          <circle cx="10" cy="18" r="2.2" fill="#6d28d9" />
          <circle cx="14" cy="18" r="2.2" fill="#6d28d9" />
          <circle cx="12" cy="21.5" r="1.8" fill="#5b21b6" />
          <path d="M12 3V7M12 4C14 4 16 5 16 7" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'Mandarina':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="13.5" r="7.5" fill="#f97316" />
          <circle cx="12" cy="13.5" r="6" fill="#ea580c" />
          <path d="M12 6C13 3 16 4 16 4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="10" cy="11" rx="1" ry="2" fill="#fed7aa" opacity="0.6" />
        </svg>
      );
    case 'Sin Gas':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 3C12 3 6 10 6 15C6 18.3 8.7 21 12 21C15.3 21 18 18.3 18 15C18 10 12 3 12 3Z" fill="#38bdf8" />
          <ellipse cx="10" cy="14" rx="1.5" ry="3" fill="#e0f2fe" opacity="0.8" />
        </svg>
      );
    case 'Con Gas':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 3C12 3 6 10 6 15C6 18.3 8.7 21 12 21C15.3 21 18 18.3 18 15C18 10 12 3 12 3Z" fill="#0284c7" />
          <circle cx="10" cy="16" r="1.5" fill="#ffffff" />
          <circle cx="14" cy="13" r="1" fill="#ffffff" />
          <circle cx="11" cy="10" r="0.8" fill="#ffffff" />
        </svg>
      );
    case 'Limón':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <ellipse cx="12" cy="12" rx="7.5" ry="6" fill="#eab308" transform="rotate(-30 12 12)" />
          <circle cx="12" cy="12" r="4.5" fill="#facc15" />
          <path d="M12 8V16M8 12H16" stroke="#ca8a04" strokeWidth="1" />
        </svg>
      );
    case 'Durazno':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 20C7 20 4 16 5 11C6 6 11 5 12 7C13 5 18 6 19 11C20 16 17 20 12 20Z" fill="#fb923c" />
          <path d="M12 6C12 3 14 3 14 3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return <Sparkles className={`w-5 h-5 text-blue-600 ${className}`} />;
  }
}

const FLAVOR_STYLES: Record<string, { bgSelected: string; borderSelected: string; ringSelected: string }> = {
  'Piña': { bgSelected: 'bg-amber-50/90', borderSelected: 'border-amber-500', ringSelected: 'ring-2 ring-amber-400/25' },
  'Tamarindo': { bgSelected: 'bg-amber-100/90', borderSelected: 'border-amber-700', ringSelected: 'ring-2 ring-amber-600/25' },
  'Mora': { bgSelected: 'bg-purple-50/90', borderSelected: 'border-purple-600', ringSelected: 'ring-2 ring-purple-500/25' },
  'Uva': { bgSelected: 'bg-violet-50/90', borderSelected: 'border-violet-600', ringSelected: 'ring-2 ring-violet-500/25' },
  'Mandarina': { bgSelected: 'bg-orange-50/90', borderSelected: 'border-orange-500', ringSelected: 'ring-2 ring-orange-400/25' },
  'Sin Gas': { bgSelected: 'bg-sky-50/90', borderSelected: 'border-sky-500', ringSelected: 'ring-2 ring-sky-400/25' },
  'Con Gas': { bgSelected: 'bg-blue-50/90', borderSelected: 'border-blue-600', ringSelected: 'ring-2 ring-blue-500/25' },
  'Limón': { bgSelected: 'bg-yellow-50/90', borderSelected: 'border-yellow-500', ringSelected: 'ring-2 ring-yellow-400/25' },
  'Durazno': { bgSelected: 'bg-orange-50/90', borderSelected: 'border-orange-400', ringSelected: 'ring-2 ring-orange-300/25' },
};

export function BeverageOrderPasarela({ onGoToCheckout }: BeverageOrderPasarelaProps) {
  const { catalog, addToCart, clients, selectedClientId } = useDistribution();

  // Active Client & Pricing Tier (Normal / Distribuidor / Especial)
  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  const clientTier = activeClient?.clientTier || 'normal';

  // Tipo de Bebida
  const [selectedType, setSelectedType] = useState<BeverageType>('Colas');

  const availableOptionsForType = useMemo(() => {
    return catalog.filter((opt) => opt.beverageType === selectedType);
  }, [catalog, selectedType]);

  // Formato seleccionado
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    availableOptionsForType[0]?.id || ''
  );

  // Asegurar selección válida cuando cambia la categoría
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

  // VENTA MIXTA: Javas y Unidades Sueltas
  const [javasCount, setJavasCount] = useState<number>(1);
  const [unitsCount, setUnitsCount] = useState<number>(0);

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

    // Reset counts to default
    setJavasCount(1);
    setUnitsCount(0);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Category Pills Header */}
      <div className="flex items-center space-x-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
        {(['Colas', 'Aguas', 'Tés'] as BeverageType[]).map((type) => {
          const isSelected = selectedType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
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
                    onClick={() => setSelectedOptionId(option.id)}
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
                      onClick={() => setFlavorMode('single')}
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
                      onClick={() => setFlavorMode('surtido')}
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
                    const style = FLAVOR_STYLES[flavor] || {
                      bgSelected: 'bg-slate-50',
                      borderSelected: 'border-slate-900',
                      ringSelected: 'ring-2 ring-slate-400/25',
                    };

                    return (
                      <button
                        key={flavor}
                        type="button"
                        onClick={() => setSelectedSingleFlavor(flavor)}
                        className={`p-2 sm:p-2.5 rounded-xl border text-center flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 transition-all active:scale-[0.98] ${
                          isSelected
                            ? `${style.bgSelected} ${style.borderSelected} ${style.ringSelected} shadow-xs`
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {/* Vector Fruit SVG */}
                        <div className="w-8 h-8 rounded-lg bg-white shadow-2xs border border-slate-100 flex items-center justify-center flex-shrink-0">
                          <FruitVectorIcon flavor={flavor} size={20} className="w-5 h-5" />
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

                      return (
                        <div
                          key={flavor}
                          className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                              <FruitVectorIcon flavor={flavor} size={22} />
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
                    {formatCurrency(currentTotalSubtotal)}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                    {javasCount > 0 && `${javasCount} ${javasCount === 1 ? 'Java' : 'Javas'}`}
                    {javasCount > 0 && unitsCount > 0 && ' + '}
                    {unitsCount > 0 && `${unitsCount} ${unitsCount === 1 ? 'Unidad suelta' : 'Unidades sueltas'}`}
                    {javasCount === 0 && unitsCount === 0 && 'Selecciona cantidad'}
                  </div>
                </div>

                {/* Dual Stepper Pills: Javas & Unidades */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  {/* Javas Pill */}
                  <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-xs font-black text-slate-700 px-1">Javas:</span>
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
                className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.99] ${
                  canAddToCart
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>
                  Agregar al Pedido • {formatCurrency(currentTotalSubtotal)}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
