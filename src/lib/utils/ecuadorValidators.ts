/**
 * Algoritmo Profesional y Riguroso de Validación de Números Celulares de Ecuador
 * Basado en las regulaciones de numeración móvil de ARCOTEL Ecuador y
 * patrones anti-fraude / anti-números falsos.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  cleanDigits: string;
  formatted: string;
  isProvided: boolean;
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
 * y rechaza cualquier número falso (consecutivos, repetitivos, prefijos inexistentes o ceros).
 */
export function validateEcuadorianPhone(input: string): PhoneValidationResult {
  let digits = input.replace(/\D/g, '');

  // Normalizar prefijo 593
  if (digits.startsWith('593')) {
    digits = '0' + digits.slice(3);
  } else if (digits.startsWith('9') && digits.length === 9) {
    digits = '0' + digits;
  }

  // 1. Campo Opcional por Privacidad: Si está completamente vacío, es válido pero no provisto
  if (!digits) {
    return {
      isValid: true,
      cleanDigits: '',
      formatted: '',
      isProvided: false,
    };
  }

  // 2. Longitud exacta requerida si se proporciona
  if (digits.length < 10) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      isProvided: true,
      error: `Número incompleto (${digits.length}/10 dígitos)`,
    };
  }

  if (digits.length > 10) {
    digits = digits.slice(0, 10);
  }

  // 3. Prefijo obligatorio de celular en Ecuador: "09"
  if (!digits.startsWith('09')) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      isProvided: true,
      error: 'Debe empezar con 09 (código móvil de Ecuador)',
    };
  }

  // 4. Rango de operadores móviles activos en Ecuador (ARCOTEL: 092 a 099)
  // 092, 093, 094, 095, 096, 097, 098, 099
  const operatorDigit = parseInt(digits.charAt(2), 10);
  if (operatorDigit < 2 || operatorDigit > 9) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      isProvided: true,
      error: `El prefijo 09${operatorDigit} no corresponde a ninguna operadora de Ecuador`,
    };
  }

  // 5. Primer dígito del abonado (4to dígito del número):
  // En Ecuador, los números de abonado móvil asignados por ARCOTEL inician entre 2 y 9.
  // El 0 y el 1 están estrictamente reservados para servicios especiales y enrutamiento.
  // Ej: 096 000 0000 o 099 012 3456 son números ficticios.
  const subscriberFirstDigit = parseInt(digits.charAt(3), 10);
  if (subscriberFirstDigit < 2 || subscriberFirstDigit > 9) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      isProvided: true,
      error: 'Número no válido (el abonado no puede iniciar en 0 o 1)',
    };
  }

  // 6. Detección de dígitos repetitivos consecutivos (4 o más repeticiones consecutivas)
  // Ejemplos: 096 000 0000, 099 888 8888, 098 777 7777
  if (/(\d)\1{3,}/.test(digits)) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      isProvided: true,
      error: 'Número ficticio detectado (demasiados dígitos repetidos)',
    };
  }

  // 7. Diversidad mínima de dígitos (Mínimo 5 dígitos distintos para evitar combinaciones falsas)
  // Ejemplos falsos: 099 889 9889 (sólo 3 dígitos únicos), 096 666 6666
  const uniqueDigitsCount = new Set(digits.split('')).size;
  if (uniqueDigitsCount < 5) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      isProvided: true,
      error: 'Número no válido (patrón de dígitos insuficiente)',
    };
  }

  // 8. Detección de secuencias consecutivas ascendentes o descendentes (4 o más dígitos)
  // Ejemplos: 1234, 2345, 3456, 4567, 5678, 6789, 4321, 5432, 6543, 7654, 8765, 9876
  const sequentialPatterns = [
    '0123',
    '1234',
    '2345',
    '3456',
    '4567',
    '5678',
    '6789',
    '7890',
    '9876',
    '8765',
    '7654',
    '6543',
    '5432',
    '4321',
    '3210',
    '1212',
    '2323',
    '3434',
    '4545',
    '5656',
    '6767',
    '7878',
    '8989',
  ];

  for (const seq of sequentialPatterns) {
    if (digits.includes(seq)) {
      return {
        isValid: false,
        cleanDigits: digits,
        formatted: formatEcuadorianPhone(digits),
        isProvided: true,
        error: `Secuencia no permitida (${seq})`,
      };
    }
  }

  // 9. Detección de bloques repetitivos dobles (ej: 098 565 6565)
  const subscriberBody = digits.slice(3); // 7 dígitos
  if (/^(\d{2,3})\1+/.test(subscriberBody)) {
    return {
      isValid: false,
      cleanDigits: digits,
      formatted: formatEcuadorianPhone(digits),
      isProvided: true,
      error: 'Patrón repetitivo detectado',
    };
  }

  return {
    isValid: true,
    cleanDigits: digits,
    formatted: formatEcuadorianPhone(digits),
    isProvided: true,
  };
}
