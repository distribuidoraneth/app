export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatItemTitle(item: {
  beverageType?: string;
  container?: string;
  size?: string;
  selectedFlavor?: string;
  flavorType?: string;
}): string {
  const brand = 'Fructi';
  let bev = 'Cola';
  if (item.beverageType === 'Aguas') bev = 'Agua';
  else if (item.beverageType === 'Tés') bev = 'Té';

  const flavor = item.flavorType === 'surtido'
    ? 'Surtida'
    : (item.selectedFlavor ? item.selectedFlavor : '');

  return `${brand} ${bev}${flavor ? ' ' + flavor : ''}`.trim();
}

export function formatItemFullDescription(item: {
  beverageType?: string;
  container?: string;
  size?: string;
  selectedFlavor?: string;
  flavorType?: string;
}): string {
  const title = formatItemTitle(item);
  const details = [item.size, item.container].filter(Boolean).join(' • ');
  return details ? `${title} (${details})` : title;
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
