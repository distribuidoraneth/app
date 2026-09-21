import { CartItem } from '@/types';
import { JAVA_PRODUCT_CATALOG } from '@/lib/mockData';

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

  const shortPrefixMap: Record<string, string> = {
    'opt-colas-plastico-300': 'FRU-300',
    'opt-colas-plastico-500': 'FRU-500',
    'opt-colas-plastico-1500': 'FRU-1.5L',
    'opt-colas-plastico-3000': 'FRU-3.0L',
    'opt-colas-vidrio-300': 'FRU-300-VID',
    'opt-tes-plastico-550': 'TES-550',
    'opt-agua-forest-600': 'AGUA-600',
    'opt-aguas-forest-600': 'AGUA-600',
    'opt-agua-forest-1000': 'AGUA-1L',
    'opt-aguas-forest-1000': 'AGUA-1L',
  };

  const prefix = shortPrefixMap[productOptionId] || cleanBase;
  if (unitType) {
    return `${prefix}-${unitType}`;
  }

  const legacyMap: Record<string, string> = {
    'opt-colas-plastico-300': 'FRU-300-PAQ',
    'opt-colas-plastico-500': 'FRU-500-PAQ',
    'opt-colas-plastico-1500': 'FRU-1.5L-PAQ',
    'opt-colas-plastico-3000': 'FRU-3.0L-PAQ',
    'opt-colas-vidrio-300': 'FRU-300-JAV',
    'opt-tes-plastico-550': 'TES-550-PAQ',
    'opt-agua-forest-600': 'AGUA-600-PAQ',
    'opt-aguas-forest-600': 'AGUA-600-PAQ',
    'opt-agua-forest-1000': 'AGUA-1L-PAQ',
    'opt-aguas-forest-1000': 'AGUA-1L-PAQ',
  };
  return legacyMap[productOptionId] || prefix;
}

export function formatInvoiceItemDescription(
  item: {
    brand?: string;
    size?: string;
    container?: string;
    flavorType?: string;
    selectedFlavor?: string;
    unitsPerJava?: number;
    productOptionId?: string;
  },
  type: 'pack' | 'unit'
): string {
  // Cross-reference with official catalog if available
  const cat = item.productOptionId
    ? JAVA_PRODUCT_CATALOG.find((c) => c.id === item.productOptionId)
    : null;

  let brand = cat?.brand || item.brand || 'Fructi';
  let size = cat?.size || item.size || '';
  let container = cat?.container || item.container || 'Plástico';
  let unitsCount = cat?.unitsPerJava || item.unitsPerJava;

  // Safeguards for size if catalog match was missing but ID indicates 3000
  if (!size || size === '500 ml' || size === '300 ml') {
    if (item.productOptionId?.includes('3000') || item.productOptionId?.includes('3.0')) {
      size = '3.0 Litros';
      unitsCount = 6;
    }
  }

  const isVidrio = (container || '').toLowerCase().includes('vid');
  const packName = isVidrio ? 'Java' : 'Pack';
  const effectiveUnits =
    unitsCount || (isVidrio ? 24 : size.includes('3.0') || size.includes('3L') ? 6 : 12);
  const flavor = item.flavorType === 'surtido' ? 'Surtido' : item.selectedFlavor || 'Original';

  const baseTitle = `${brand} ${size} ${container} - ${flavor}`.replace(/\s+/g, ' ').trim();

  if (type === 'pack') {
    return `${baseTitle} (${packName} x ${effectiveUnits})`;
  } else {
    return baseTitle;
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

export type FacturaLine = FacturaItemLine;

/**
 * Desglosa los ítems del carrito en líneas oficiales para SRI / RIDE.
 * - Si un ítem tiene tanto Packs como Unidades sueltas, se desglosa en 2 líneas discretas:
 *   1. Línea de Packs (SKU tipo FRU-500-PAQ / FRU-300-JAV, cant. en packs, precio unitario de pack).
 *   2. Línea de Unidades (SKU tipo FRU-500-UND, cant. en unidades, precio unitario de botella).
 * - Si solo tiene packs o solo tiene unidades sueltas, genera 1 sola línea limpia.
 * - Garantiza suma matemática estricta sin descuadres de centavos y NUNCA genera valores negativos.
 */
export function expandCartItemsToFacturaLines(
  items?: CartItem[] | null,
  ivaRate: number = 15
): FacturaItemLine[] {
  if (!items || !Array.isArray(items) || items.length === 0) return [];
  const lines: FacturaItemLine[] = [];

  for (const item of items) {
    if (!item) continue;

    // Cross reference with catalog to ensure correct prices, units, and presentations
    const cat = item.productOptionId
      ? JAVA_PRODUCT_CATALOG.find((c) => c.id === item.productOptionId)
      : null;

    const brand = cat?.brand || item.brand || 'Fructi';
    const container = cat?.container || item.container || 'Plástico';
    const isVidrio = (container || '').toLowerCase().includes('vid');
    const packSkuType = isVidrio ? 'JAV' : 'PAQ';
    const packUnitMedida = isVidrio ? 'java' : 'pack';

    let size = cat?.size || item.size || '';
    if (item.productOptionId?.includes('3000') || item.productOptionId?.includes('3.0')) {
      size = '3.0 Litros';
    }

    const unitsPerJava =
      cat?.unitsPerJava ||
      item.unitsPerJava ||
      (isVidrio ? 24 : size.includes('3.0') || size.includes('3L') ? 6 : 12);

    const pricePerJava = item.pricePerJava > 0 ? item.pricePerJava : (cat?.pricePerJava || 0);
    const pricePerUnit =
      item.pricePerUnit > 0
        ? item.pricePerUnit
        : cat?.pricePerUnit || Number(((pricePerJava || 0) / unitsPerJava).toFixed(4));

    const quantityJavas = Math.max(0, Number(item.quantityJavas) || 0);
    const quantityUnits = Math.max(0, Number(item.quantityUnits) || 0);
    const hasJavas = quantityJavas > 0;
    const hasUnits = quantityUnits > 0;
    const subtotal = Math.max(0, Number(item.subtotal) || 0);

    const resolvedItem = {
      ...item,
      brand,
      size,
      container,
      unitsPerJava,
      pricePerJava,
      pricePerUnit,
    };

    // Caso 1: Mixto (Packs y Unidades sueltas en el mismo producto)
    if (hasJavas && hasUnits) {
      // Línea 1: Packs (estrictamente no negativo)
      const subtotalPacksConIva = Math.max(0, Number((quantityJavas * pricePerJava).toFixed(2)));
      const baseImponiblePack =
        ivaRate > 0
          ? Math.max(0, Number((subtotalPacksConIva / (1 + ivaRate / 100)).toFixed(2)))
          : subtotalPacksConIva;
      const ivaPack = Math.max(0, Number((subtotalPacksConIva - baseImponiblePack).toFixed(2)));
      const pUnitPackSinIva = Number((baseImponiblePack / quantityJavas).toFixed(4));

      lines.push({
        codigoPrincipal: formatProductSku(item.productOptionId, packSkuType),
        descripcion: formatInvoiceItemDescription(resolvedItem, 'pack'),
        cantidad: quantityJavas,
        precioUnitarioSinIva: pUnitPackSinIva,
        descuento: 0,
        precioTotalSinImpuesto: baseImponiblePack,
        iva: ivaPack,
        subtotalConIva: subtotalPacksConIva,
        tipo: 'pack',
        unidadMedida: packUnitMedida,
      });

      // Línea 2: Unidades Sueltas (calculada directamente por cantidad * unit_price, NUNCA por resta ciega)
      let subtotalUnitsConIva = Math.max(0, Number((quantityUnits * pricePerUnit).toFixed(2)));

      // Ajuste fino de 1 o 2 centavos si difiere del subtotal total de la orden
      if (subtotal > 0) {
        const sumWithPacks = Number((subtotalPacksConIva + subtotalUnitsConIva).toFixed(2));
        const diff = Number((subtotal - sumWithPacks).toFixed(2));
        if (Math.abs(diff) <= 0.05) {
          subtotalUnitsConIva = Math.max(0, Number((subtotalUnitsConIva + diff).toFixed(2)));
        }
      }

      const baseImponibleUnits =
        ivaRate > 0
          ? Math.max(0, Number((subtotalUnitsConIva / (1 + ivaRate / 100)).toFixed(2)))
          : subtotalUnitsConIva;
      const ivaUnits = Math.max(0, Number((subtotalUnitsConIva - baseImponibleUnits).toFixed(2)));
      const pUnitUndSinIva = Number((baseImponibleUnits / quantityUnits).toFixed(4));

      lines.push({
        codigoPrincipal: formatProductSku(item.productOptionId, 'UND'),
        descripcion: formatInvoiceItemDescription(resolvedItem, 'unit'),
        cantidad: quantityUnits,
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
      const subtotalConIva =
        subtotal > 0 ? subtotal : Math.max(0, Number((quantityJavas * pricePerJava).toFixed(2)));
      const baseImponible =
        ivaRate > 0
          ? Math.max(0, Number((subtotalConIva / (1 + ivaRate / 100)).toFixed(2)))
          : subtotalConIva;
      const iva = Math.max(0, Number((subtotalConIva - baseImponible).toFixed(2)));
      const pUnitSinIva = Number((baseImponible / quantityJavas).toFixed(4));

      lines.push({
        codigoPrincipal: formatProductSku(item.productOptionId, packSkuType),
        descripcion: formatInvoiceItemDescription(resolvedItem, 'pack'),
        cantidad: quantityJavas,
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
      const subtotalConIva =
        subtotal > 0 ? subtotal : Math.max(0, Number((quantityUnits * pricePerUnit).toFixed(2)));
      const baseImponible =
        ivaRate > 0
          ? Math.max(0, Number((subtotalConIva / (1 + ivaRate / 100)).toFixed(2)))
          : subtotalConIva;
      const iva = Math.max(0, Number((subtotalConIva - baseImponible).toFixed(2)));
      const pUnitSinIva = Number((baseImponible / quantityUnits).toFixed(4));

      lines.push({
        codigoPrincipal: formatProductSku(item.productOptionId, 'UND'),
        descripcion: formatInvoiceItemDescription(resolvedItem, 'unit'),
        cantidad: quantityUnits,
        precioUnitarioSinIva: pUnitSinIva,
        descuento: 0,
        precioTotalSinImpuesto: baseImponible,
        iva,
        subtotalConIva,
        tipo: 'unit',
        unidadMedida: 'und',
      });
    } else {
      // Caso 4: Fallback
      const cant = item.totalBottles && item.totalBottles > 0 ? item.totalBottles : 1;
      const subtotalConIva = Math.max(0, subtotal);
      const baseImponible =
        ivaRate > 0
          ? Math.max(0, Number((subtotalConIva / (1 + ivaRate / 100)).toFixed(2)))
          : subtotalConIva;
      const iva = Math.max(0, Number((subtotalConIva - baseImponible).toFixed(2)));
      const pUnitSinIva = Number((baseImponible / cant).toFixed(4));

      lines.push({
        codigoPrincipal: formatProductSku(item.productOptionId, 'UND'),
        descripcion: formatInvoiceItemDescription(resolvedItem, 'unit'),
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
  amountPaid?: number;
  debtBalance?: number;
  promisedCollectionDate?: string;
  promisedCollectionTime?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
}): string {
  let cleanPhone = params.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '593' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('593')) {
    cleanPhone = '593' + cleanPhone;
  }

  const invoiceRef = params.invoiceNumber || params.orderNumber;
  const invLink =
    params.invoiceUrl ||
    `${typeof window !== 'undefined' ? window.location.origin : 'https://distribuidora-aneth.vercel.app'}/factura/${invoiceRef}`;

  const hasDebt = (params.debtBalance || 0) > 0;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let cleanOrderNumber = params.orderNumber;
  if (isUuid.test(cleanOrderNumber)) {
    cleanOrderNumber = params.invoiceNumber ? `FAC-${params.invoiceNumber}` : `ORD-${cleanOrderNumber.slice(0, 8).toUpperCase()}`;
  } else if (!cleanOrderNumber.startsWith('ORD-') && !cleanOrderNumber.startsWith('FAC-')) {
    cleanOrderNumber = formatOrderNumber(cleanOrderNumber);
  }

  let message = `*ANETH DISTRIBUCIONES*\nComprobante de Entrega\n\n`;
  message += `*Pedido:* ${cleanOrderNumber}\n`;
  message += `*Cliente:* ${params.clientName}\n`;

  if (hasDebt) {
    message += `*Total:* $${params.total.toFixed(2)}\n`;
    if (params.amountPaid !== undefined) {
      message += `*Abono:* $${params.amountPaid.toFixed(2)}\n`;
    }
    message += `*Saldo Pendiente:* $${(params.debtBalance || 0).toFixed(2)}\n`;
    if (params.promisedCollectionDate) {
      message += `*Fecha de cobro:* ${params.promisedCollectionDate}${
        params.promisedCollectionTime ? ` (${params.promisedCollectionTime})` : ''
      }\n`;
    }
  } else {
    message += `*Total:* $${params.total.toFixed(2)} (Pagado)\n`;
  }

  if (params.invoiceNumber || params.invoiceUrl) {
    message += `\n*Factura Electrónica SRI:*\n${invLink}\n`;
  }

  message += `\n¡Gracias por su preferencia!`;

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
