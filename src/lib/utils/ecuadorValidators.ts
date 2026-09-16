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

// Mapa oficial de Provincias de Ecuador (Códigos 01 a 24 y 30)
export const ECUADOR_PROVINCES: Record<string, string> = {
  '01': 'Azuay',
  '02': 'Bolívar',
  '03': 'Cañar',
  '04': 'Carchi',
  '05': 'Cotopaxi',
  '06': 'Chimborazo',
  '07': 'El Oro',
  '08': 'Esmeraldas',
  '09': 'Guayas',
  '10': 'Imbabura',
  '11': 'Loja',
  '12': 'Los Ríos',
  '13': 'Manabí',
  '14': 'Morona Santiago',
  '15': 'Napo',
  '16': 'Pastaza',
  '17': 'Pichincha',
  '18': 'Tungurahua',
  '19': 'Zamora Chinchipe',
  '20': 'Galápagos',
  '21': 'Sucumbíos',
  '22': 'Orellana',
  '23': 'Santo Domingo de los Tsáchilas',
  '24': 'Santa Elena',
  '30': 'Ecuatorianos en el Exterior',
};

export interface TaxIdValidationResult {
  isValid: boolean;
  type: '04' | '05'; // '04' RUC, '05' Cédula
  cleanDigits: string;
  error?: string;
  province?: string;
  taxpayerType?: 'natural' | 'publica' | 'privada';
}

/**
 * Valida una Cédula de Identidad Ecuatoriana (10 dígitos)
 * Aplica algoritmo oficial de Módulo 10 con coeficientes [2,1,2,1,2,1,2,1,2] y validación de provincia.
 */
export function validateEcuadorianCedula(input: string): TaxIdValidationResult {
  const digits = (input || '').replace(/\D/g, '');

  if (!digits) {
    return { isValid: false, type: '05', cleanDigits: '', error: 'Ingrese el número de cédula' };
  }

  if (digits.length !== 10) {
    return {
      isValid: false,
      type: '05',
      cleanDigits: digits,
      error: `La cédula debe tener exactamente 10 dígitos (${digits.length}/10)`,
    };
  }

  // 1. Validar código de provincia (01 - 24 o 30)
  const provCode = digits.substring(0, 2);
  const provNum = parseInt(provCode, 10);
  if (!((provNum >= 1 && provNum <= 24) || provNum === 30)) {
    return {
      isValid: false,
      type: '05',
      cleanDigits: digits,
      error: `El código de provincia "${provCode}" no existe en Ecuador (01-24 o 30)`,
    };
  }

  const provinceName = ECUADOR_PROVINCES[provCode] || 'Provincia Especial';

  // 2. Tercer dígito debe ser menor a 6 (0 al 5) para personas naturales
  const thirdDigit = parseInt(digits.charAt(2), 10);
  if (thirdDigit >= 6) {
    return {
      isValid: false,
      type: '05',
      cleanDigits: digits,
      error: 'El tercer dígito de una cédula debe estar entre 0 y 5',
    };
  }

  // 3. Algoritmo Módulo 10
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let product = parseInt(digits.charAt(i), 10) * coefficients[i];
    if (product >= 10) {
      product -= 9;
    }
    sum += product;
  }

  const expectedVerifier = (10 - (sum % 10)) % 10;
  const actualVerifier = parseInt(digits.charAt(9), 10);

  if (expectedVerifier !== actualVerifier) {
    return {
      isValid: false,
      type: '05',
      cleanDigits: digits,
      error: 'Dígito verificador incorrecto. Cédula inválida',
      province: provinceName,
    };
  }

  return {
    isValid: true,
    type: '05',
    cleanDigits: digits,
    province: provinceName,
    taxpayerType: 'natural',
  };
}

/**
 * Valida un RUC Ecuatoriano (13 dígitos)
 * Aplica los 3 algoritmos oficiales según el tipo de contribuyente:
 * - Persona Natural: Módulo 10 sobre cédula + sufijo 001..999
 * - Sociedad Pública: Módulo 11 (coeficientes [3,2,7,6,5,4,3,2]) + sufijo 0001..9999
 * - Sociedad Privada / Jurídica: Módulo 11 (coeficientes [4,3,2,7,6,5,4,3,2]) + sufijo 001..999
 */
export function validateEcuadorianRuc(input: string): TaxIdValidationResult {
  const digits = (input || '').replace(/\D/g, '');

  if (!digits) {
    return { isValid: false, type: '04', cleanDigits: '', error: 'Ingrese el número de RUC' };
  }

  if (digits.length !== 13) {
    return {
      isValid: false,
      type: '04',
      cleanDigits: digits,
      error: `El RUC debe tener exactamente 13 dígitos (${digits.length}/13)`,
    };
  }

  // 1. Validar código de provincia
  const provCode = digits.substring(0, 2);
  const provNum = parseInt(provCode, 10);
  if (!((provNum >= 1 && provNum <= 24) || provNum === 30)) {
    return {
      isValid: false,
      type: '04',
      cleanDigits: digits,
      error: `El código de provincia "${provCode}" no existe en Ecuador`,
    };
  }

  const provinceName = ECUADOR_PROVINCES[provCode] || 'Provincia Especial';
  const thirdDigit = parseInt(digits.charAt(2), 10);

  // CASO 1: Persona Natural (Tercer dígito: 0 a 5)
  if (thirdDigit < 6) {
    const cedulaPart = digits.substring(0, 10);
    const cedulaRes = validateEcuadorianCedula(cedulaPart);

    if (!cedulaRes.isValid) {
      return {
        isValid: false,
        type: '04',
        cleanDigits: digits,
        error: cedulaRes.error || 'La base de cédula del RUC no es válida',
        province: provinceName,
      };
    }

    const establishment = digits.substring(10, 13);
    if (establishment === '000') {
      return {
        isValid: false,
        type: '04',
        cleanDigits: digits,
        error: 'El establecimiento del RUC no puede ser 000 (mínimo 001)',
        province: provinceName,
      };
    }

    return {
      isValid: true,
      type: '04',
      cleanDigits: digits,
      province: provinceName,
      taxpayerType: 'natural',
    };
  }

  // CASO 2: Sociedad Pública / Institución Estatal (Tercer dígito = 6)
  if (thirdDigit === 6) {
    const coefficients = [3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += parseInt(digits.charAt(i), 10) * coefficients[i];
    }

    const remainder = sum % 11;
    const expectedVerifier = remainder === 0 ? 0 : 11 - remainder;
    const actualVerifier = parseInt(digits.charAt(8), 10);

    if (expectedVerifier !== actualVerifier) {
      return {
        isValid: false,
        type: '04',
        cleanDigits: digits,
        error: 'Dígito verificador de institución pública incorrecto',
        province: provinceName,
      };
    }

    const establishment = digits.substring(9, 13);
    if (establishment === '0000') {
      return {
        isValid: false,
        type: '04',
        cleanDigits: digits,
        error: 'El establecimiento del RUC público no puede ser 0000',
        province: provinceName,
      };
    }

    return {
      isValid: true,
      type: '04',
      cleanDigits: digits,
      province: provinceName,
      taxpayerType: 'publica',
    };
  }

  // CASO 3: Sociedad Privada / Jurídica / Extranjeros (Tercer dígito = 9)
  if (thirdDigit === 9) {
    const coefficients = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits.charAt(i), 10) * coefficients[i];
    }

    const remainder = sum % 11;
    const expectedVerifier = remainder === 0 ? 0 : 11 - remainder;
    const actualVerifier = parseInt(digits.charAt(9), 10);

    if (expectedVerifier !== actualVerifier) {
      return {
        isValid: false,
        type: '04',
        cleanDigits: digits,
        error: 'Dígito verificador de sociedad privada incorrecto',
        province: provinceName,
      };
    }

    const establishment = digits.substring(10, 13);
    if (establishment === '000') {
      return {
        isValid: false,
        type: '04',
        cleanDigits: digits,
        error: 'El establecimiento del RUC privado no puede ser 000',
        province: provinceName,
      };
    }

    return {
      isValid: true,
      type: '04',
      cleanDigits: digits,
      province: provinceName,
      taxpayerType: 'privada',
    };
  }

  // Si el tercer dígito es 7 u 8
  return {
    isValid: false,
    type: '04',
    cleanDigits: digits,
    error: `El tercer dígito (${thirdDigit}) no es válido para RUC en Ecuador`,
    province: provinceName,
  };
}

/**
 * Validador Universal de Identificación Fiscal Ecuatoriana (Cédula o RUC)
 */
export function validateEcuadorianTaxId(input: string, expectedType?: '04' | '05'): TaxIdValidationResult {
  const digits = (input || '').replace(/\D/g, '');

  if (expectedType === '04') {
    return validateEcuadorianRuc(digits);
  }

  if (expectedType === '05') {
    return validateEcuadorianCedula(digits);
  }

  // Si no se especifica tipo, deducir por longitud
  if (digits.length === 13) {
    return validateEcuadorianRuc(digits);
  }

  return validateEcuadorianCedula(digits);
}

