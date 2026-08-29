/**
 * Módulo de Generación y Validación de Claves de Acceso del SRI Ecuador (49 Dígitos)
 * Especificación Técnica: Ficha Técnica Comprobantes Electrónicos Esquema Offline v1.1.0
 */

/**
 * Calcula el Dígito Verificador usando el algoritmo Módulo 11 oficial del SRI.
 * Factores de ponderación cíclicos de 2 a 7 de derecha a izquierda.
 */
export function calcularModulo11(cadena48: string): number {
  let factor = 2;
  let suma = 0;

  for (let i = cadena48.length - 1; i >= 0; i--) {
    suma += parseInt(cadena48.charAt(i), 10) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const residuo = suma % 11;
  const digito = 11 - residuo;

  if (digito === 11) return 0;
  if (digito === 10) return 1;
  return digito;
}

/**
 * Genera la clave de acceso de 49 dígitos única por comprobante.
 */
export function generarClaveAcceso(params: {
  fecha: Date; // Fecha de emisión
  tipoComprobante?: string; // '01' para Factura
  ruc: string; // 13 dígitos
  ambiente: '1' | '2'; // '1': Pruebas, '2': Producción
  establecimiento?: string; // 3 dígitos ej: '001'
  puntoEmision?: string; // 3 dígitos ej: '001'
  secuencial: number; // Número secuencial correlativo
  codigoNumerico?: string; // 8 dígitos de seguridad opcionales
}): string {
  const pad = (num: number | string, size: number) => String(num).padStart(size, '0');

  const dia = pad(params.fecha.getDate(), 2);
  const mes = pad(params.fecha.getMonth() + 1, 2);
  const anio = params.fecha.getFullYear().toString();
  const fechaStr = `${dia}${mes}${anio}`;

  const tipoComp = pad(params.tipoComprobante || '01', 2);
  const rucStr = pad(params.ruc.replace(/\D/g, ''), 13);
  const estabStr = pad(params.establecimiento || '001', 3);
  const ptoEmiStr = pad(params.puntoEmision || '001', 3);
  const serie = `${estabStr}${ptoEmiStr}`;
  const secuencialStr = pad(params.secuencial, 9);
  const codigoNum = params.codigoNumerico
    ? pad(params.codigoNumerico, 8)
    : pad(Math.floor(10000000 + Math.random() * 90000000), 8);
  const tipoEmision = '1'; // Emisión Normal

  const base48 = `${fechaStr}${tipoComp}${rucStr}${params.ambiente}${serie}${secuencialStr}${codigoNum}${tipoEmision}`;
  const digitoVerificador = calcularModulo11(base48);

  return `${base48}${digitoVerificador}`;
}
