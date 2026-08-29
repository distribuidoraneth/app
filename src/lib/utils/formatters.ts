export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
  const cleanPhone = params.phone.replace(/[^0-9]/g, '');
  let message = `Estimado(a) *${params.clientName}*,\nLe saluda *Distribuidora Aneth*.\n\n`;
  message += `Le confirmamos la recepción de su pedido *#${params.orderNumber}* por un valor total de *${formatCurrency(params.total)}*.\n\n`;

  if (params.invoiceNumber) {
    message += `Comprobante / Factura emitida: *${params.invoiceNumber}*\n`;
    message += `Puede consultar y descargar su factura en el siguiente enlace:\n${params.invoiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://distribuidoraneth.com') + '/factura/' + params.invoiceNumber}\n\n`;
  } else {
    message += `Su pedido se encuentra en preparación para despacho.\n\n`;
  }

  message += `Agradecemos su preferencia.\n*Distribuidora Aneth*`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function getWazeNavigationUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

export function getGoogleMapsNavigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
