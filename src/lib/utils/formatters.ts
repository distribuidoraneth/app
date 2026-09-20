export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
