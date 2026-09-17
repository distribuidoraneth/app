'use client';

import React, { useMemo } from 'react';

interface BarcodeSVGProps {
  value: string;
  height?: number;
  width?: number;
  showText?: boolean;
  className?: string;
}

// Code 128 Patterns (107 patterns, each 11 modules wide, plus stop character 13 modules)
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP)
];

function encodeCode128B(text: string): string[] {
  const codes: number[] = [104]; // Start Code B
  let checksum = 104;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const codeVal = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(codeVal);
    checksum += codeVal * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(106); // Stop Code

  return codes.map((c) => CODE128_PATTERNS[c] || CODE128_PATTERNS[0]);
}

export const BarcodeSVG: React.FC<BarcodeSVGProps> = ({
  value,
  height = 40,
  showText = true,
  className = '',
}) => {
  const patterns = useMemo(() => {
    const cleanVal = (value || '0000000000').slice(0, 49);
    return encodeCode128B(cleanVal);
  }, [value]);

  // Convert width strings to bar sequence
  const bars: { x: number; width: number }[] = useMemo(() => {
    let currentX = 0;
    const result: { x: number; width: number }[] = [];

    // Quiet zone at start
    currentX += 10;

    patterns.forEach((pat) => {
      let isBar = true;
      for (let i = 0; i < pat.length; i++) {
        const barWidth = parseInt(pat[i], 10);
        if (isBar) {
          result.push({ x: currentX, width: barWidth });
        }
        currentX += barWidth;
        isBar = !isBar;
      }
    });

    return result;
  }, [patterns]);

  const totalWidth = useMemo(() => {
    if (bars.length === 0) return 200;
    const lastBar = bars[bars.length - 1];
    return lastBar.x + lastBar.width + 10; // + quiet zone
  }, [bars]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full h-auto max-w-[240px]"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
      >
        <rect width={totalWidth} height={height} fill="#ffffff" />
        {bars.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={0}
            width={b.width}
            height={height}
            fill="#000000"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[8px] tracking-tighter text-black break-all text-center pt-0.5 leading-none select-all">
          {value}
        </span>
      )}
    </div>
  );
};
