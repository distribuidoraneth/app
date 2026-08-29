'use client';

import React from 'react';

export interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'color' | 'white' | 'dark' | 'monochrome';
  showSubtitle?: boolean;
  subtitleText?: 'DISTRIBUIDORA' | 'Distribuciones' | string;
}

const sizeMap = {
  xs: 'h-6',
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-20',
  '2xl': 'h-28',
};

/**
 * Isotipo Oficial "A" Vectorial (Exacto al Manual de Marca)
 */
export function AnethIsotype({
  className = '',
  size = 'md',
  variant = 'color',
}: Omit<LogoProps, 'showSubtitle' | 'subtitleText'>) {
  // Color configuration
  const topColor = variant === 'white' ? '#FFFFFF' : '#081225';
  const accentColor =
    variant === 'white'
      ? '#FFFFFF'
      : variant === 'monochrome' || variant === 'dark'
      ? '#081225'
      : '#0066FF';

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeMap[size]} w-auto inline-block ${className}`}
      aria-label="Isotipo Aneth"
    >
      {/* Arco Superior y Pata Derecha de la 'A' */}
      <path
        d="M34.5 45.8L51.8 19.2C53.6 16.4 57.5 15.5 60.5 17.2C62.1 18.2 63.2 19.8 63.7 21.6L87.2 81.5C88.1 83.8 87.0 86.4 84.7 87.3C83.8 87.7 82.8 87.7 81.8 87.4L67.5 82.8C65.5 82.2 64.1 80.5 63.5 78.5L47.5 37.8L34.5 45.8Z"
        fill={topColor}
      />
      {/* Pata Izquierda Dinámica y Travesaño (Azul Eléctrico / Blanco) */}
      <path
        d="M34.2 46.2L13.8 81.2C12.5 83.4 13.3 86.3 15.6 87.5C16.5 88.0 17.6 88.1 18.6 87.8L31.8 83.2C33.7 82.6 35.1 81.0 35.7 79.1L42.8 57.2H58.6C60.8 57.2 62.6 55.4 62.6 53.2C62.6 51.5 61.5 50.0 59.9 49.4L37.2 46.1C36.2 45.9 35.1 46.0 34.2 46.2Z"
        fill={accentColor}
      />
    </svg>
  );
}

/**
 * Logotipo Completo "ANETH" con Camión Integrado en la "H" (Exacto al Manual de Marca)
 */
export function AnethFullLogo({
  className = '',
  size = 'md',
  variant = 'color',
  showSubtitle = true,
  subtitleText = 'DISTRIBUIDORA',
}: LogoProps) {
  const isWhite = variant === 'white';
  const textColor = isWhite ? '#FFFFFF' : '#081225';
  const blueColor = isWhite ? '#FFFFFF' : variant === 'monochrome' || variant === 'dark' ? '#081225' : '#0066FF';
  const subtextColor = isWhite ? '#94A3B8' : '#475569';

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <svg
        viewBox="0 0 380 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeMap[size]} w-auto block`}
        aria-label="Logo Distribuidora Aneth"
      >
        {/* ================= LETRA 'A' ================= */}
        <g id="letter-A">
          {/* Parte superior de la A */}
          <path
            d="M30 38L44 16.5C45.5 14.2 48.6 13.5 51 14.9C52.3 15.7 53.2 17 53.6 18.5L72.5 67.5C73.2 69.4 72.3 71.5 70.4 72.2C69.7 72.5 68.9 72.5 68.1 72.3L56.5 68.6C54.9 68.1 53.8 66.7 53.3 65.1L40.3 31.8L30 38Z"
            fill={textColor}
          />
          {/* Parte inferior y travesaño azul */}
          <path
            d="M29.8 38.3L13.5 66.5C12.5 68.2 13.1 70.5 14.8 71.5C15.5 71.9 16.4 72.0 17.2 71.8L27.8 68.1C29.3 67.6 30.4 66.3 30.9 64.8L36.6 47.2H49.5C51.3 47.2 52.7 45.8 52.7 44C52.7 42.6 51.8 41.4 50.5 40.9L32.2 38.2C31.4 38.1 30.5 38.1 29.8 38.3Z"
            fill={blueColor}
          />
        </g>

        {/* ================= LETRA 'N' ================= */}
        <g id="letter-N" fill={textColor}>
          <path d="M84 15H98.5L127 54.5V15H140V72H126.5L97 31.5V72H84V15Z" />
        </g>

        {/* ================= LETRA 'E' ================= */}
        <g id="letter-E" fill={textColor}>
          <path d="M152 15H195V27H166V37.5H191V49H166V60H196V72H152V15Z" />
        </g>

        {/* ================= LETRA 'T' ================= */}
        <g id="letter-T" fill={textColor}>
          <path d="M203 15H249V27H233V72H219V27H203V15Z" />
        </g>

        {/* ================= LETRA 'H' + CAMIÓN DE REPARTO ================= */}
        <g id="letter-H-truck">
          {/* Palo izquierdo de la H */}
          <rect x="257" y="15" width="13" height="57" fill={textColor} />
          {/* Travesaño central de la H */}
          <rect x="270" y="37.5" width="22" height="12" fill={textColor} />
          {/* Palo derecho de la H */}
          <rect x="292" y="15" width="13" height="57" fill={textColor} />

          {/* Líneas de Velocidad (Speed Lines del Camión) */}
          <line
            x1="272"
            y1="16"
            x2="315"
            y2="16"
            stroke={blueColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="272"
            y1="71"
            x2="315"
            y2="71"
            stroke={blueColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Cabina y Carrocería del Camión */}
          <path
            d="M315 16H340C344 16 347.5 18 349.5 21.5L359.5 38.5C361 41 364 42.5 367 42.5H372C374.2 42.5 376 44.3 376 46.5V67C376 69.2 374.2 71 372 71H358.5"
            stroke={blueColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Ventana de la Cabina */}
          <path
            d="M346 22H338V38H356.5L348.5 24C347.8 22.8 346.5 22 346 22Z"
            fill={blueColor}
            opacity="0.25"
          />

          {/* Luz Delantera */}
          <rect x="366" y="50" width="8" height="4" rx="2" fill={blueColor} />

          {/* Rueda del Camión */}
          <circle cx="340" cy="71" r="11" fill={isWhite ? '#081225' : '#FFFFFF'} stroke={blueColor} strokeWidth="4" />
          <circle cx="340" cy="71" r="4.5" fill={blueColor} />
        </g>
      </svg>

      {/* Subtítulo Oficial con Kerning Amplio */}
      {showSubtitle && (
        <span
          className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.34em] pl-1.5 -mt-0.5 select-none`}
          style={{ color: subtextColor }}
        >
          {subtitleText}
        </span>
      )}
    </div>
  );
}

/**
 * Icono de Camión de Reparto Rápido Aneth
 */
export function AnethDeliveryIcon({
  className = '',
  size = 'md',
  color = '#0066FF',
}: {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeMap[size]} w-auto inline-block ${className}`}
    >
      <line x1="10" y1="12" x2="45" y2="12" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <line x1="5" y1="60" x2="45" y2="60" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <path
        d="M45 12H68C72 12 75.5 14 77.5 17.5L87.5 34.5C89 37 92 38.5 95 38.5H98C99.1 38.5 100 39.4 100 40.5V58C100 59.1 99.1 60 98 60H84.5"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="68" cy="60" r="9" fill="#FFFFFF" stroke={color} strokeWidth="4" />
      <circle cx="68" cy="60" r="3.5" fill={color} />
      <rect x="91" y="44" width="7" height="3" rx="1.5" fill={color} />
    </svg>
  );
}
