import React from 'react';
import { BeverageSize, ContainerType } from '@/types';

interface BottleVectorProps {
  size: BeverageSize;
  container?: ContainerType;
  isSelected?: boolean;
  className?: string;
}

export function BottleVectorIcon({
  size,
  container = 'Plástico',
  isSelected = false,
  className = '',
}: BottleVectorProps) {
  const accentColor = isSelected ? '#1D4ED8' : '#64748B';
  const bodyFill = isSelected ? '#EFF6FF' : '#F8FAFC';
  const liquidColor = isSelected ? '#3B82F6' : '#94A3B8';
  const strokeColor = isSelected ? '#1D4ED8' : '#475569';

  // 1. Vidrio 300 ml (Silueta clásica retornable)
  if (container === 'Vidrio' && size === '300 ml') {
    return (
      <svg
        viewBox="0 0 36 64"
        className={`h-11 w-auto max-h-12 ${className}`}
        style={{ maxHeight: '48px', width: 'auto' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Crown Cap */}
        <path d="M14 4H22V6.5C22 7 21.5 7.5 21 7.5H15C14.5 7.5 14 7 14 6.5V4Z" fill={accentColor} />
        {/* Glass Bottle Body */}
        <path
          d="M15 7.5H21V16C21 21 26 24 26 29V56C26 58.5 24 60 21.5 60H14.5C12 60 10 58.5 10 56V29C10 24 15 21 15 16V7.5Z"
          fill={bodyFill}
          stroke={strokeColor}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Glass Emboss Line */}
        <path d="M12.5 38H23.5" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
        {/* Liquid Fill */}
        <path
          d="M11.5 32C11.5 32 15 31 18 31C21 31 24.5 32 24.5 32V55C24.5 57 23 58.5 21 58.5H15C13 58.5 11.5 57 11.5 55V32Z"
          fill={liquidColor}
          opacity="0.85"
        />
        {/* Reflection */}
        <path d="M14 35V52" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      </svg>
    );
  }

  // 2. Plástico 250 ml (Compacta)
  if (size === '250 ml') {
    return (
      <svg
        viewBox="0 0 36 54"
        className={`h-9 w-auto max-h-12 ${className}`}
        style={{ maxHeight: '38px', width: 'auto' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Smooth Cap */}
        <rect x="14" y="3" width="8" height="4" rx="1.5" fill={accentColor} />
        {/* Bottle Body */}
        <path
          d="M15 7H21V12C21 15 25 18 25 22V46C25 48.5 23 50.5 20.5 50.5H15.5C13 50.5 11 48.5 11 46V22C11 18 15 15 15 12V7Z"
          fill={bodyFill}
          stroke={strokeColor}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Liquid */}
        <path
          d="M12.5 24C12.5 24 15 23 18 23C21 23 23.5 24 23.5 24V45C23.5 47 22 48.5 20 48.5H16C14 48.5 12.5 47 12.5 45V24Z"
          fill={liquidColor}
          opacity="0.85"
        />
      </svg>
    );
  }

  // 3. Plástico 300 ml (Estándar)
  if (size === '300 ml') {
    return (
      <svg
        viewBox="0 0 36 58"
        className={`h-10 w-auto max-h-12 ${className}`}
        style={{ maxHeight: '42px', width: 'auto' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Smooth Cap */}
        <rect x="14" y="3" width="8" height="4" rx="1.5" fill={accentColor} />
        {/* Bottle Body */}
        <path
          d="M15 7H21V13C21 16.5 25.5 19.5 25.5 24V49C25.5 51.5 23.5 53.5 21 53.5H15C12.5 53.5 10.5 51.5 10.5 49V24C10.5 19.5 15 16.5 15 13V7Z"
          fill={bodyFill}
          stroke={strokeColor}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Liquid */}
        <path
          d="M12 26C12 26 15 25 18 25C21 25 24 26 24 26V48C24 50 22.5 51.5 20.5 51.5H15.5C13.5 51.5 12 50 12 48V26Z"
          fill={liquidColor}
          opacity="0.85"
        />
      </svg>
    );
  }

  // 4. Plástico 500 ml (Medio Litro)
  if (size === '500 ml') {
    return (
      <svg
        viewBox="0 0 36 66"
        className={`h-11 w-auto max-h-12 ${className}`}
        style={{ maxHeight: '46px', width: 'auto' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Smooth Cap */}
        <rect x="14" y="3" width="8" height="4" rx="1.5" fill={accentColor} />
        {/* Bottle Body */}
        <path
          d="M15 7H21V15C21 19 26 22 26 27V57C26 59.5 24 61.5 21.5 61.5H14.5C12 61.5 10 59.5 10 57V27C10 22 15 19 15 15V7Z"
          fill={bodyFill}
          stroke={strokeColor}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Grip Rings */}
        <path d="M10.5 39H25.5M10.5 44H25.5" stroke={strokeColor} strokeWidth="0.9" opacity="0.4" />
        {/* Liquid */}
        <path
          d="M11.5 29C11.5 29 15 28 18 28C21 28 24.5 29 24.5 29V56C24.5 58 23 59.5 21 59.5H15C13 59.5 11.5 58 11.5 56V29Z"
          fill={liquidColor}
          opacity="0.85"
        />
      </svg>
    );
  }

  // 5. Plástico 1.5 Litros (1500 ml)
  if (size === '1.5 Litros' || size === '1500 ml') {
    return (
      <svg
        viewBox="0 0 38 74"
        className={`h-12 w-auto max-h-12 ${className}`}
        style={{ maxHeight: '50px', width: 'auto' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Smooth Cap */}
        <rect x="14.5" y="2" width="9" height="4.5" rx="1.5" fill={accentColor} />
        {/* Tall Bottle Body */}
        <path
          d="M15.5 6.5H22.5V17C22.5 21 28 25 28 30V65C28 68 25.5 70.5 22.5 70.5H15.5C12.5 70.5 10 68 10 65V30C10 25 15.5 21 15.5 17V6.5Z"
          fill={bodyFill}
          stroke={strokeColor}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        {/* Waist groove */}
        <path d="M10.5 45C13 46 25 46 27.5 45" stroke={strokeColor} strokeWidth="1" opacity="0.4" />
        {/* Liquid */}
        <path
          d="M11.5 32C11.5 32 15.5 31 19 31C22.5 31 26.5 32 26.5 32V64C26.5 66.5 24.5 68.5 22 68.5H16C13.5 68.5 11.5 66.5 11.5 64V32Z"
          fill={liquidColor}
          opacity="0.85"
        />
      </svg>
    );
  }

  // 6. Plástico 3.0 Litros (3000 ml Mega Botellón)
  return (
    <svg
      viewBox="0 0 46 74"
      className={`h-12 w-auto max-h-12 ${className}`}
      style={{ maxHeight: '50px', width: 'auto' }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wide Cap */}
      <rect x="17" y="2" width="12" height="5" rx="2" fill={accentColor} />
      {/* Wide Bottle Body */}
      <path
        d="M18.5 7H27.5V16C27.5 20.5 37 25 37 32V64C37 67.5 34 70.5 30 70.5H16C12 70.5 9 67.5 9 64V32C9 25 18.5 20.5 18.5 16V7Z"
        fill={bodyFill}
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Structural Ribs */}
      <path d="M10 40H36M10 48H36M10 56H36" stroke={strokeColor} strokeWidth="1" opacity="0.35" />
      {/* Liquid Fill */}
      <path
        d="M11 34C11 34 17 32.5 23 32.5C29 32.5 35 34 35 34V63C35 66 32.5 68.5 29.5 68.5H16.5C13.5 68.5 11 66 11 63V34Z"
        fill={liquidColor}
        opacity="0.85"
      />
    </svg>
  );
}
