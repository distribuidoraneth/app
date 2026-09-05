'use client';

import React, { useMemo } from 'react';
import QRCode from 'qrcode';

interface PoplQRCodeSVGProps {
  value: string;
  size?: number;
  color?: string;
  bgColor?: string;
  className?: string;
}

export const PoplQRCodeSVG: React.FC<PoplQRCodeSVGProps> = ({
  value,
  size = 120,
  color = '#000000',
  bgColor = '#ffffff',
  className = '',
}) => {
  const qrData = useMemo(() => {
    try {
      const qr = QRCode.create(value || 'ANETH-DISTRIBUCIONES', {
        errorCorrectionLevel: 'M',
      });
      return {
        size: qr.modules.size,
        getModule: (r: number, c: number) => qr.modules.get(r, c) === 1,
      };
    } catch {
      return null;
    }
  }, [value]);

  if (!qrData) return null;

  const matrixSize = qrData.size;
  const moduleSize = 10;
  const svgSize = matrixSize * moduleSize;

  // Determinar si una celda pertenece a los patrones de posición de las 3 esquinas (7x7)
  const isFinderPattern = (r: number, c: number) => {
    if (r < 7 && c < 7) return true; // Top-Left
    if (r < 7 && c >= matrixSize - 7) return true; // Top-Right
    if (r >= matrixSize - 7 && c < 7) return true; // Bottom-Left
    return false;
  };

  const dots: React.ReactNode[] = [];

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (isFinderPattern(r, c)) continue;

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

  return (
    <svg
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      width={size}
      height={size}
      className={className}
      style={{ background: bgColor }}
    >
      <rect width={svgSize} height={svgSize} fill={bgColor} />
      {dots}
      {finders}
    </svg>
  );
};
