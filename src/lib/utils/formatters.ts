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

export function formatOrderNumber(orderNumber: string): string {
  if (!orderNumber) return 'ORD - 1';
  // Remove leading '#' or prefix 'ORD-' with leading zeros
  const numPart = orderNumber.replace(/[^0-9]/g, '');
  const cleanInt = parseInt(numPart, 10);
  if (!isNaN(cleanInt)) {
    return `ORD - ${cleanInt}`;
  }
  return orderNumber.replace(/^#/, '');
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
