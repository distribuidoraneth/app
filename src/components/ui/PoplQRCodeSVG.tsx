'use client';

import React, { useMemo } from 'react';
import QRCode from 'qrcode';
import { PATH_ISOTYPE_TOP, PATH_ISOTYPE_SWOOSH } from '@/components/ui/AnethLogo';

export interface PoplQRCodeSVGProps {
  value: string;
  size?: number;
  color?: string;
  bgColor?: string;
  className?: string;
  showIsotypeLogo?: boolean;
  isotypeVariant?: 'color' | 'monochrome';
  id?: string;
}

export const PoplQRCodeSVG: React.FC<PoplQRCodeSVGProps> = ({
  value,
  size = 120,
  color = '#000000',
  bgColor = '#ffffff',
  className = '',
  showIsotypeLogo = false,
  isotypeVariant = 'color',
  id,
}) => {
  const qrData = useMemo(() => {
    try {
      // Usar nivel 'H' (30% de redundancia) cuando se integra el logotipo central
      const qr = QRCode.create(value || 'ANETH-DISTRIBUCIONES', {
        errorCorrectionLevel: showIsotypeLogo ? 'H' : 'M',
      });
      return {
        size: qr.modules.size,
        getModule: (r: number, c: number) => qr.modules.get(r, c) === 1,
      };
    } catch {
      return null;
    }
  }, [value, showIsotypeLogo]);

  if (!qrData) return null;

  const matrixSize = qrData.size;
  const moduleSize = 10;
  const svgSize = matrixSize * moduleSize;
  const centerCoord = (matrixSize - 1) / 2;
  const centerPixelX = (matrixSize * moduleSize) / 2;
  const centerPixelY = (matrixSize * moduleSize) / 2;

  // Radio circular en unidades de módulo para despejar puntos de manera armónica (Popl style)
  // Con corrección de error 'H' (30%), un radio de 3.8 módulos consume apenas ~7.5% del área, garantizando lectura instantánea
  const clearRadiusModules = showIsotypeLogo ? 3.8 : 0;
  const circleRadiusPixels = clearRadiusModules * moduleSize;

  // Determinar si una celda pertenece a los patrones de posición de las 3 esquinas (7x7)
  const isFinderPattern = (r: number, c: number) => {
    if (r < 7 && c < 7) return true; // Top-Left
    if (r < 7 && c >= matrixSize - 7) return true; // Top-Right
    if (r >= matrixSize - 7 && c < 7) return true; // Bottom-Left
    return false;
  };

  // Determinar si una celda cae dentro de la zona circular despejada para el isotipo
  const isInCenterClearance = (r: number, c: number) => {
    if (!showIsotypeLogo) return false;
    const cellDist = Math.hypot(r - centerCoord, c - centerCoord);
    return cellDist <= clearRadiusModules;
  };

  const dots: React.ReactNode[] = [];

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (isFinderPattern(r, c)) continue;
      if (isInCenterClearance(r, c)) continue;

      if (qrData.getModule(r, c)) {
        const cx = c * moduleSize + moduleSize / 2;
        const cy = r * moduleSize + moduleSize / 2;
        // Puntos circulares estilo Popl
        dots.push(
          <circle
            key={`dot-${r}-${c}`}
            cx={cx}
            cy={cy}
            r={moduleSize * 0.42}
            fill={color}
          />
        );
      }
    }
  }

  // Finders: esquinas redondeadas exteriores e interiores estilo Popl
  const renderFinder = (xOffset: number, yOffset: number, key: string) => {
    const finderSize = 7 * moduleSize;
    const outerRadius = moduleSize * 2.2;
    const innerRadius = moduleSize * 1.1;

    return (
      <g key={key} transform={`translate(${xOffset}, ${yOffset})`}>
        <rect
          x={moduleSize * 0.5}
          y={moduleSize * 0.5}
          width={finderSize - moduleSize}
          height={finderSize - moduleSize}
          rx={outerRadius}
          ry={outerRadius}
          fill="none"
          stroke={color}
          strokeWidth={moduleSize * 0.9}
        />
        <rect
          x={moduleSize * 2.2}
          y={moduleSize * 2.2}
          width={moduleSize * 2.6}
          height={moduleSize * 2.6}
          rx={innerRadius}
          ry={innerRadius}
          fill={color}
        />
      </g>
    );
  };

  const finders = [
    renderFinder(0, 0, 'finder-tl'),
    renderFinder((matrixSize - 7) * moduleSize, 0, 'finder-tr'),
    renderFinder(0, (matrixSize - 7) * moduleSize, 'finder-bl'),
  ];

  // Dimensionamiento y centrado armónico del Isotipo "A" dentro del disco central
  const targetWidth = Math.round(circleRadiusPixels * 1.22);
  const targetHeight = (targetWidth * 615) / 809;
  const scale = targetWidth / 809;
  const offsetX = centerPixelX - targetWidth / 2;
  const offsetY = centerPixelY - targetHeight / 2;

  const topColor = isotypeVariant === 'monochrome' ? color : '#0f172a';
  const swooshColor = isotypeVariant === 'monochrome' ? color : '#0071e3';

  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      width={size}
      height={size}
      className={className}
      style={{ background: bgColor }}
      shapeRendering="geometricPrecision"
    >
      <rect width={svgSize} height={svgSize} fill={bgColor} />
      {dots}
      {finders}

      {/* Isotipo "A" en disco circular puro y prolijo (Popl style sin cajas cuadradas dentadas) */}
      {showIsotypeLogo && (
        <g id="popl-center-logo">
          {/* Círculo blanco puro para contraste óptico de escaneo */}
          <circle
            cx={centerPixelX}
            cy={centerPixelY}
            r={circleRadiusPixels * 0.96}
            fill={bgColor}
          />
          {/* Silueta del Isotipo "A" con su cuerpo superior y swoosh azul dinámico */}
          <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
            <path d={PATH_ISOTYPE_TOP} fill={topColor} fillRule="evenodd" />
            <path d={PATH_ISOTYPE_SWOOSH} fill={swooshColor} fillRule="evenodd" />
          </g>
        </g>
      )}
    </svg>
  );
};
