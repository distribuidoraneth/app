'use client';

import React, { useMemo } from 'react';

// Code 128 pattern table (0 - 106)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

interface SriBarcodeProps {
  value: string;
  className?: string;
  height?: number;
}

export function SriBarcodeSVG({ value, className = 'w-full h-12', height = 45 }: SriBarcodeProps) {
  const barcodeData = useMemo(() => {
    const clean = (value || '').replace(/\D/g, '');
    if (!clean) return null;

    const codes = [105]; // Start C
    let checksum = 105;
    let weight = 1;

    // Pairs of digits in Code C
    for (let i = 0; i < clean.length - 1; i += 2) {
      const val = parseInt(clean.substring(i, i + 2), 10);
      codes.push(val);
      checksum += val * weight;
      weight++;
    }

    // If odd length (e.g. 49 digits), switch to Code B for last digit
    if (clean.length % 2 !== 0) {
      codes.push(100); // Code B switch
      checksum += 100 * weight;
      weight++;

      const lastCharVal = clean.charCodeAt(clean.length - 1) - 32;
      codes.push(lastCharVal);
      checksum += lastCharVal * weight;
      weight++;
    }

    codes.push(checksum % 103);
    codes.push(106); // Stop symbol

    let patternStr = '';
    for (const c of codes) {
      if (c >= 0 && c < CODE128_PATTERNS.length) {
        patternStr += CODE128_PATTERNS[c];
      }
    }

    let currentX = 0;
    const bars: { x: number; width: number }[] = [];
    for (let i = 0; i < patternStr.length; i++) {
      const width = parseInt(patternStr[i], 10);
      if (i % 2 === 0) {
        bars.push({ x: currentX, width });
      }
      currentX += width;
    }

    return { totalWidth: currentX, bars };
  }, [value]);

  if (!barcodeData) return null;

  return (
    <svg
      viewBox={`0 0 ${barcodeData.totalWidth} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-label={`Código de barras para clave de acceso ${value}`}
    >
      {barcodeData.bars.map((bar, idx) => (
        <rect
          key={idx}
          x={bar.x}
          y={0}
          width={bar.width}
          height={height}
          fill="#000000"
        />
      ))}
    </svg>
  );
}
