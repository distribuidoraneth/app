import { CartItem } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatUnitPrice(amount: number): string {
  const rounded2 = Number(amount.toFixed(2));
  const isFractionalCent = Math.abs(amount - rounded2) > 0.0001;
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: isFractionalCent ? 4 : 2,
  }).format(amount);
}

export function formatContainerAbbrev(container?: string): string {
  if (!container) return 'Plást.';
  const lower = container.toLowerCase();
  if (lower.includes('vid')) return 'Vid.';
  return 'Plást.';
}

export function formatSizeAbbrev(size?: string): string {
  if (!size) return '';
  return size
    .replace(/1\.5\s*(Litros?|L|lt)/i, '1.5L')
    .replace(/3\.0\s*(Litros?|L|lt)/i, '3L')
    .replace(/3\s*(Litros?|L|lt)/i, '3L')
    .replace(/1(\.0)?\s*(Litros?|L|lt)/i, '1L')
    .replace(/(\d+)\s*ml/i, '$1ml')
    .trim();
}

export function formatItemTitle(item: {
  brand?: string;
  beverageType?: string;
  container?: string;
  size?: string;
  selectedFlavor?: string;
  flavorType?: string;
}): string {
  const brand = item.brand || 'Fructi';
  const containerAbbr = formatContainerAbbrev(item.container);
  const sizeAbbr = formatSizeAbbrev(item.size);
  const flavor = item.flavorType === 'surtido'
    ? 'Surtido'
    : (item.selectedFlavor || '');

  // Estructura: [Marca] [Envase Abrev] [Tamaño] - [Sabor]
  // Ej: Fructi Plást. 1.5L - Piña
  // Ej: Fructi Vid. 300ml - Mora
  // Ej: Fructi Plást. 300ml - Surtido
  const presentation = [brand, containerAbbr, sizeAbbr].filter(Boolean).join(' ');
  return flavor ? `${presentation} - ${flavor}` : presentation;
}

export function formatItemFullDescription(item: {
  brand?: string;
  beverageType?: string;
  container?: string;
  size?: string;
  selectedFlavor?: string;
  flavorType?: string;
}): string {
  return formatItemTitle(item);
}

export function generateOrderNumber(
  client?: { taxId?: string; whatsappNumber?: string },
  date: Date = new Date()
): string {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');

  // Sufijo de 3 dígitos basado en cédula/RUC, teléfono o milisegundos aleatorios
  let suffix = '';
  const cleanTaxId = client?.taxId ? client.taxId.replace(/\D/g, '') : '';
  const cleanPhone = client?.whatsappNumber ? client.whatsappNumber.replace(/\D/g, '') : '';

  if (cleanTaxId.length >= 3 && cleanTaxId !== '9999999999999') {
    suffix = cleanTaxId.slice(-3);
  } else if (cleanPhone.length >= 3) {
    suffix = cleanPhone.slice(-3);
  } else {
    suffix = String((date.getMilliseconds() % 900) + 100).padStart(3, '0');
  }

  return `ORD-${yyyy}${mm}${dd}-${hh}${min}${ss}-${suffix}`;
}

export function formatOrderNumber(orderNumber: string): string {
  if (!orderNumber) return 'ORD-1';
  const clean = orderNumber.trim().replace(/^#/, '');

  // Si ya es el formato estructurado con guiones ej: ORD-20260920-101542-810
  if (clean.includes('-') && clean.split('-').length >= 3) {
    return clean;
  }

  // Si es un formato antiguo secuencial ej: ORD-00101 -> ORD - 101
  const numPart = clean.replace(/[^0-9]/g, '');
  if (numPart && numPart.length <= 5) {
    const cleanInt = parseInt(numPart, 10);
    if (!isNaN(cleanInt)) {
      return `ORD - ${cleanInt}`;
    }
  }

  return clean.startsWith('ORD-') ? clean : `ORD-${clean}`;
}

export function formatShortDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[date.getMonth()];
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' should be 12

    return `${day} ${month} ${hours}:${minutes} ${ampm}`;
  } catch {
    return dateString;
  }
}

export function formatSmartOrderTime(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return timeStr;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Ayer, ${timeStr}`;
    }

    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');

    return `${day} ${month}, ${timeStr}`;
  } catch {
    return dateString;
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatSriDate(dateInput: string | Date | number): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

export function formatSriDateTime(dateInput: string | Date | number): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return String(dateInput);
  }
}

export function formatProductSku(productOptionId?: string, unitType?: 'PAQ' | 'JAV' | 'UND'): string {
  if (!productOptionId) return unitType ? `PROD-${unitType}` : 'PROD-01';

  const cleanBase = productOptionId
    .replace(/^opt-/, '')
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, '');

  if (unitType) {
    const shortPrefixMap: Record<string, string> = {
      'opt-colas-plastico-300': 'FRU-300',
      'opt-colas-plastico-500': 'FRU-500',
      'opt-colas-plastico-1500': 'FRU-1.5L',
      'opt-colas-plastico-3000': 'FRU-3.0L',
      'opt-colas-vidrio-300': 'FRU-300',
      'opt-tes-plastico-550': 'TES-550',
      'opt-agua-forest-600': 'AGUA-600',
      'opt-agua-forest-1000': 'AGUA-1L',
    };
    const prefix = shortPrefixMap[productOptionId] || cleanBase;
    return `${prefix}-${unitType}`;
  }

  const legacyMap: Record<string, string> = {
    'opt-colas-plastico-300': 'FRU-300-PLAS',
    'opt-colas-plastico-500': 'FRU-500-PLAS',
    'opt-colas-plastico-1500': 'FRU-1.5L-PLAS',
    'opt-colas-plastico-3000': 'FRU-3.0L-PLAS',
    'opt-colas-vidrio-300': 'FRU-300-VID',
    'opt-tes-plastico-550': 'TES-550-PLAS',
    'opt-agua-forest-600': 'AGUA-600-PLAS',
    'opt-agua-forest-1000': 'AGUA-1L-PLAS',
  };
  return legacyMap[productOptionId] || cleanBase;
}

export function formatInvoiceItemDescription(
  item: {
    brand?: string;
    size?: string;
    container?: string;
    flavorType?: string;
    selectedFlavor?: string;
    unitsPerJava?: number;
  },
  type: 'pack' | 'unit'
): string {
  const brand = item.brand || 'Fructi';
  const flavor = item.flavorType === 'surtido' ? 'Surtido' : (item.selectedFlavor || 'Original');
  const isVidrio = (item.container || '').toLowerCase().includes('vid');
  const packName = isVidrio ? 'Java' : 'Pack';
  const unitsCount = item.unitsPerJava || (isVidrio ? 24 : 12);
  const container = item.container || (isVidrio ? 'Vidrio' : 'Plástico');
  const size = item.size || '';

  const baseTitle = `${brand} ${size} ${container} - ${flavor}`.replace(/\s+/g, ' ').trim();

  if (type === 'pack') {
    return `${baseTitle} (${packName} x ${unitsCount})`;
  } else {
    return `${baseTitle} (Unidad suelta)`;
  }
}

export interface FacturaItemLine {
  codigoPrincipal: string;
  descripcion: string;
  cantidad: number;
  precioUnitarioSinIva: number;
  descuento: number;
  precioTotalSinImpuesto: number;
  iva: number;
  subtotalConIva: number;
  tipo: 'pack' | 'unit';
  unidadMedida: 'pack' | 'java' | 'und';
}

/**
 * Desglosa los ítems del carrito en líneas oficiales para SRI / RIDE.
 * Opción 1:
 * - Si un ítem tiene tanto Packs como Unidades sueltas, se desglosa en 2 líneas discretas:
 *   1. Línea de Packs (SKU tipo FRU-500-PAQ / FRU-300-JAV, cant. en packs, precio unitario de pack).
 *   2. Línea de Unidades (SKU tipo FRU-500-UND, cant. en unidades, precio unitario de botella).
 * - Si solo tiene packs o solo tiene unidades sueltas, genera 1 sola línea limpia.
 * - Garantiza suma matemática estricta sin descuadres de centavos.
 */
export function expandCartItemsToFacturaLines(
  items: CartItem[],
  ivaRate: number = 15
): FacturaItemLine[] {
  const lines: FacturaItemLine[] = [];

  for (const item of items) {
    const isVidrio = (item.container || '').toLowerCase().includes('vid');
    const packSkuType = isVidrio ? 'JAV' : 'PAQ';
    const packUnitMedida = isVidrio ? 'java' : 'pack';
    const hasJavas = (item.quantityJavas || 0) > 0;
    const hasUnits = (item.quantityUnits || 0) > 0;

    // Caso 1: Mixto (Packs y Unidades sueltas en el mismo producto)
    if (hasJavas && hasUnits) {
      // Línea 1: Packs
      const subtotalPacksConIva = Number((item.quantityJavas * (item.pricePerJava || 0)).toFixed(2));
      const baseImponiblePack =
        ivaRate > 0
          ? Number((subtotalPacksConIva / (1 + ivaRate / 100)).toFixed(2))
          : subtotalPacksConIva;
      const ivaPack = Number((subtotalPacksConIva - baseImponiblePack).toFixed(2));
      const pUnitPackSinIva = Number((baseImponiblePack / item.quantityJavas).toFixed(4));

      lines.push({
        codigoPrincipal: formatProductSku(item.productOptionId, packSkuType),
        descripcion: formatInvoiceItemDescription(item, 'pack'),
        cantidad: item.quantityJavas,
        precioUnitarioSinIva: pUnitPackSinIva,
        descuento: 0,
        precioTotalSinImpuesto: baseImponiblePack,
        iva: ivaPack,
        subtotalConIva: subtotalPacksConIva,
        tipo: 'pack',
        unidadMedida: packUnitMedida,
      });

      // Línea 2: Unidades Sueltas
      const subtotalUnitsConIva = Number((item.subtotal - subtotalPacksConIva).toFixed(2));
      const baseImponibleUnits =
        ivaRate > 0
          ? Number((subtotalUnitsConIva / (1 + ivaRate / 100)).toFixed(2))
          : subtotalUnitsConIva;
      const ivaUnits = Number((subtotalUnitsConIva - baseImponibleUnits).toFixed(2));
      const pUnitUndSinIva = Number((baseImponibleUnits / item.quantityUnits).toFixed(4));

      lines.push({
        codigoPrincipal: formatProductSku(item.productOptionId, 'UND'),
        descripcion: formatInvoiceItemDescription(item, 'unit'),
        cantidad: item.quantityUnits,
        precioUnitarioSinIva: pUnitUndSinIva,
        descuento: 0,
        precioTotalSinImpuesto: baseImponibleUnits,
        iva: ivaUnits,
        subtotalConIva: subtotalUnitsConIva,
        tipo: 'unit',
        unidadMedida: 'und',
      });
    } else if (hasJavas) {
      // Caso 2: Solo Packs / Javas
      const subtotalConIva = Number(item.subtotal.toFixed(2));
      const baseImponible =
        ivaRate > 0
          ? Number((subtotalConIva / (1 + ivaRate / 100)).toFixed(2))
          : subtotalConIva;
      const iva = Number((subtotalConIva - baseImponible).toFixed(2));
      const pUnitSinIva = Number((baseImponible / item.quantityJavas).toFixed(4));

      lines.push({
        codigoPrincipal: formatProductSku(item.productOptionId, packSkuType),
        descripcion: formatInvoiceItemDescription(item, 'pack'),
        cantidad: item.quantityJavas,
        precioUnitarioSinIva: pUnitSinIva,
        descuento: 0,
        precioTotalSinImpuesto: baseImponible,
        iva,
        subtotalConIva,
        tipo: 'pack',
        unidadMedida: packUnitMedida,
      });
    } else if (hasUnits) {
      // Caso 3: Solo Unidades Sueltas
      const subtotalConIva = Number(item.subtotal.toFixed(2));
      const baseImponible =
        ivaRate > 0
          ? Number((subtotalConIva / (1 + ivaRate / 100)).toFixed(2))
          : subtotalConIva;
      const iva = Number((subtotalConIva - baseImponible).toFixed(2));
      const pUnitSinIva = Number((baseImponible / item.quantityUnits).toFixed(4));

      lines.push({
        codigoPrincipal: formatProductSku(item.productOptionId, 'UND'),
        descripcion: formatInvoiceItemDescription(item, 'unit'),
        cantidad: item.quantityUnits,
        precioUnitarioSinIva: pUnitSinIva,
        descuento: 0,
        precioTotalSinImpuesto: baseImponible,
        iva,
        subtotalConIva,
        tipo: 'unit',
        unidadMedida: 'und',
      });
    } else {
      // Caso 4: Fallback (unidades sueltas por totalBottles o 1)
      const cant = item.totalBottles && item.totalBottles > 0 ? item.totalBottles : 1;
      const subtotalConIva = Number(item.subtotal.toFixed(2));
      const baseImponible =
        ivaRate > 0
          ? Number((subtotalConIva / (1 + ivaRate / 100)).toFixed(2))
          : subtotalConIva;
      const iva = Number((subtotalConIva - baseImponible).toFixed(2));
      const pUnitSinIva = Number((baseImponible / cant).toFixed(4));

      lines.push({
        codigoPrincipal: formatProductSku(item.productOptionId, 'UND'),
        descripcion: formatInvoiceItemDescription(item, 'unit'),
        cantidad: cant,
        precioUnitarioSinIva: pUnitSinIva,
        descuento: 0,
        precioTotalSinImpuesto: baseImponible,
        iva,
        subtotalConIva,
        tipo: 'unit',
        unidadMedida: 'und',
      });
    }
  }

  return lines;
}

export function generateWhatsAppOrderLink(params: {
  phone: string;
  clientName: string;
  orderNumber: string;
  total: number;
  invoiceNumber?: string;
  invoiceUrl?: string;
}): string {
  let cleanPhone = params.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '593' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('593')) {
    cleanPhone = '593' + cleanPhone;
  }

  let message = `Estimado(a) *${params.clientName}*,\nLe saluda *Aneth Distribuciones*.\n\n`;
  message += `Le confirmamos la recepción de su pedido *#${params.orderNumber}* por un valor total de *${formatCurrency(params.total)}*.\n\n`;

  if (params.invoiceNumber) {
    message += `Comprobante / Factura emitida: *${params.invoiceNumber}*\n`;
    message += `Puede consultar y descargar su factura en el siguiente enlace:\n${params.invoiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://distribuidora-aneth.vercel.app') + '/factura/' + params.invoiceNumber}\n\n`;
  } else {
    message += `Su pedido se encuentra en preparación para despacho.\n\n`;
  }

  message += `Agradecemos su preferencia.\n*Aneth Distribuciones*`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function getWazeNavigationUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

export function getGoogleMapsNavigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function cleanAddress(address?: string | null): string {
  if (!address) return '';
  const trimmed = address.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower === 'ubicación gps confirmada' ||
    lower === 'ubicacion gps confirmada' ||
    lower === 'ubicación de entrega' ||
    lower === 'ubicacion de entrega' ||
    lower === 'sin dirección registrada' ||
    lower === 'sin direccion registrada' ||
    lower === 'dirección registrada' ||
    lower === 'direccion registrada'
  ) {
    return '';
  }
  return trimmed;
}
