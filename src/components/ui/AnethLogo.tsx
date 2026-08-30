'use client';

import React from 'react';

export interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'color' | 'white' | 'dark' | 'monochrome' | 'boxed' | 'black';
  showSubtitle?: boolean;
  subtitleText?: string;
}

const classSizeMap = {
  xs: 'h-6',
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
  xl: 'h-16',
  '2xl': 'h-20',
};

/**
 * Isotipo Oficial "A" de Distribuidora Aneth
 * 100% Vectorial Puro Matemático (Sin rasterizados ni desenfoques)
 */
export function AnethIsotype({
  className = '',
  size = 'md',
  variant = 'color',
}: Omit<LogoProps, 'showSubtitle' | 'subtitleText'>) {
  let logoSrc = '/logos/aneth-isotype-color.svg';

  if (variant === 'black' || variant === 'monochrome') {
    logoSrc = '/logos/aneth-isotype-black.svg';
  } else if (variant === 'boxed') {
    logoSrc = '/logos/aneth-isotype-white-boxed.svg';
  } else if (variant === 'white') {
    logoSrc = '/logos/aneth-isotype-white-blue.svg';
  } else if (variant === 'color' || variant === 'dark') {
    logoSrc = '/logos/aneth-isotype-color.svg';
  }

  return (
    <div className={`inline-flex items-center justify-center ${classSizeMap[size]} w-auto aspect-square ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt="Isotipo Aneth"
        className="h-full w-auto object-contain select-none"
        loading="eager"
      />
    </div>
  );
}

/**
 * Logotipo Completo "ANETH" con Camión Integrado en la "H"
 * 100% Vectorial Puro Matemático de Alta Fidelidad
 */
export function AnethFullLogo({
  className = '',
  size = 'md',
  variant = 'color',
  showSubtitle = false,
  subtitleText = 'DISTRIBUIDORA',
}: LogoProps) {
  let logoSrc = '/logos/aneth-logo-full.svg';
  let subtextColor = '#475569';

  if (variant === 'white') {
    logoSrc = '/logos/aneth-logo-white-blue.svg';
    subtextColor = '#94A3B8';
  } else if (variant === 'dark') {
    logoSrc = '/logos/aneth-logo-dark-blue.svg';
    subtextColor = '#334155';
  } else if (variant === 'monochrome' || variant === 'black') {
    logoSrc = '/logos/aneth-logo-black-mono.svg';
    subtextColor = '#0f172a';
  }

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <div className={`${classSizeMap[size]} w-auto flex items-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Distribuidora Aneth"
          className="h-full w-auto object-contain select-none"
          loading="eager"
        />
      </div>

      {showSubtitle && (
        <span
          className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] pl-0.5 pt-0.5 select-none`}
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
}: {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  return (
    <div className={`inline-flex items-center ${classSizeMap[size]} w-auto ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/aneth-logo-full.svg"
        alt="Camión Aneth"
        className="h-full w-auto object-contain"
        loading="eager"
      />
    </div>
  );
}
