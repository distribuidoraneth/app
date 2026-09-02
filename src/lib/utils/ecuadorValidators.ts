/**
 * Algoritmo Profesional de Validación de Números Celulares de Ecuador
 * Basado en las regulaciones de numeración móvil de ARCOTEL Ecuador.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  cleanDigits: string;
  formatted: string;
  error?: string;
}

/**
 * Normaliza y formatea un número de celular ecuatoriano en tiempo real:
 * - Convierte +593 / 593 a formato estándar 09...
 * - Limpia caracteres no numéricos
 * - Aplica máscara visual: 09X XXX XXXX
 * - Limita estrictamente a 10 dígitos
 */
export function formatEcuadorianPhone(input: string): string {
  if (!input) return '';

  let digits = input.replace(/\D/g, '');

  // Si pegó o escribió con prefijo internacional 593
  if (digits.startsWith('593')) {
    digits = '0' + digits.slice(3);
  }

  // Si empieza con 9 directamente, autocompletar con 0
  if (digits.startsWith('9') && digits.length > 1) {
    digits = '0' + digits;
  }

  // Limitar estrictamente a 10 dígitos máximos de Ecuador
  digits = digits.slice(0, 10);

  // Formato visual agrupado: 09X XXX XXXX
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
}

/**
 * Valida minuciosamente si un número celular cumple con la estructura real de Ecuador
 * y rechaza números basura (consecutivos, repetitivos, prefijos falsos o incompletos).
 */
export function validateEcuadorianPhone(input: string): PhoneValidationResult {
  let digits = input.replace(/\D/g, '');

  // Normalizar prefijo 593
  if (digits.startsWith('593')) {
    digits = '0' + digits.slice(3);
  } else if (digits.startsWith('9') && digits.length === 9) {
    digits = '0' + digits;
  }

  // 1. Longitud exacta
  if (!digits) {
    return {
      isValid: false,
      cleanDigits: '',
      formatted: '',
      error: 'Ingresa el número de celular de WhatsApp',
    };
  }

  if (digits.length < 10) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      error: `Número incompleto (${digits.length}/10 dígitos)`,
    };
  }

  if (digits.length > 10) {
    return {
      isValid: false,
      cleanDigits: digits.slice(0, 10),
      formatted: formatEcuadorianPhone(digits.slice(0, 10)),
      error: 'El número no debe exceder 10 dígitos',
    };
  }

  // 2. Prefijo obligatorio de celular en Ecuador (09)
  if (!digits.startsWith('09')) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      error: 'Debe empezar con 09 (formato celular de Ecuador)',
    };
  }

  // 3. Rango de operadores móviles activos en Ecuador (ARCOTEL: 092 a 099)
  // 092, 093, 094, 095, 096, 097, 098, 099
  const operatorDigit = parseInt(digits.charAt(2), 10);
  if (operatorDigit < 2 || operatorDigit > 9) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      error: `El prefijo 09${operatorDigit} no corresponde a ninguna operadora móvil en Ecuador`,
    };
  }

  // 4. Detección de números basura: Dígitos totalmente idénticos (ej: 0000000000, 0999999999)
  const isAllSame = /^(\d)\1{9}$/.test(digits);
  if (isAllSame) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      error: 'El número no puede contener todos los dígitos iguales',
    };
  }

  // Detección de repeticiones masivas en el cuerpo del número (ej: 0966666666, 0980000000)
  const suffix = digits.slice(2); // los 8 dígitos siguientes a 09
  if (/^(\d)\1{6,}$/.test(suffix)) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      error: 'Número no válido (dígitos repetitivos detectados)',
    };
  }

  // 5. Detección de secuencias consecutivas ascendentes o descendentes
  // Ejemplos: 0912345678, 0987654321, 0123456789
  const sequences = [
    '0123456789',
    '1234567890',
    '9876543210',
    '8765432109',
    '1234567',
    '2345678',
    '3456789',
    '7654321',
    '6543210',
  ];

  for (const seq of sequences) {
    if (digits.includes(seq)) {
      return {
        isValid: false,
        cleanDigits: digits,
        formatted: formatEcuadorianPhone(digits),
        error: 'El número no puede contener secuencias consecutivas (ej: 123456)',
      };
    }
  }

  // 6. Detección de patrones alternantes falsos (ej: 0912121212, 0901010101)
  if (/(\d{2})\1{3,}/.test(suffix)) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      error: 'El número no puede contener patrones repetitivos',
    };
  }

  return {
    isValid: true,
    cleanDigits: digits,
    formatted: formatEcuadorianPhone(digits),
  };
}
