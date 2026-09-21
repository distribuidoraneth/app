/**
 * Generador de XML para Facturación Electrónica SRI Ecuador (Esquema v1.1.0)
 */

import { CartItem, CompanyTaxProfile } from '@/types';
import { formatProductSku, expandCartItemsToFacturaLines } from '@/lib/utils/formatters';

export const DEFAULT_TAX_PROFILE: CompanyTaxProfile = {
  ruc: '1803013810001',
  razonSocial: 'ANDRADE CONSTANTE ANA ELIZABETH',
  nombreComercial: 'DISTRIBUIDORA ANETH',
  dirMatriz: 'AV. ATAHUALPA S/N Y TEODORO SOLIS, AMBATO, TUNGURAHUA',
  dirEstablecimiento: 'AV. ATAHUALPA S/N Y TEODORO SOLIS, AMBATO, TUNGURAHUA',
  establecimiento: '001',
  puntoEmision: '001',
  ambiente: '1', // Por defecto pruebas
  obligadoContabilidad: 'NO',
  regimenRimpe: false,
};

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDateSRI(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function buildFacturaXml(params: {
  claveAcceso: string;
  secuencial: number;
  fechaEmision: Date;
  company: CompanyTaxProfile;
  cliente: {
    razonSocial: string;
    identificacion: string;
    tipoIdentificacion: '04' | '05' | '06' | '07'; // 04: RUC, 05: Cédula, 07: Consumidor Final
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  items: CartItem[];
  paymentMethod: 'cash' | 'transfer';
  ivaRate?: number; // 0 o 15
}): string {
  const {
    claveAcceso,
    secuencial,
    fechaEmision,
    company,
    cliente,
    items,
    paymentMethod,
    ivaRate = 15,
  } = params;

  const pad = (n: number | string, size: number) => String(n).padStart(size, '0');
  const secuencialStr = pad(secuencial, 9);
  const fechaStr = formatDateSRI(fechaEmision);

  // Desglose oficial de ítems según Opción 1:
  // Si un ítem tiene tanto Packs como Unidades sueltas, se desglosa en líneas discretas
  // con SKUs estandarizados (ej: FRU-500-PAQ y FRU-500-UND) y sumas tributarias exactas.
  const lines = expandCartItemsToFacturaLines(items, ivaRate);

  const totalSinImpuestos = Number(lines.reduce((sum, l) => sum + l.precioTotalSinImpuesto, 0).toFixed(2));
  const totalIva = Number(lines.reduce((sum, l) => sum + l.iva, 0).toFixed(2));
  const importeTotal = Number((totalSinImpuestos + totalIva).toFixed(2));

  // Forma de pago SRI: 01 = Efectivo, 20 = Otros con utilización del sistema financiero
  const formaPagoSri = paymentMethod === 'cash' ? '01' : '20';

  // Código de porcentaje de IVA: 4 = 15% (vigente en Ecuador), 0 = 0%
  const codigoPorcentajeIva = ivaRate === 15 ? '4' : '0';

  // Autodetección rigurosa de tipo de identificación del comprador para el SRI:
  // 04 = RUC (13 dígitos), 05 = Cédula (10 dígitos), 07 = Consumidor Final
  const idLimpia = (cliente.identificacion || '').trim().replace(/\D/g, '');
  let tipoIdComprador = cliente.tipoIdentificacion;
  if (!tipoIdComprador || tipoIdComprador === '07') {
    if (idLimpia.length === 10 && idLimpia !== '9999999999') {
      tipoIdComprador = '05';
    } else if (idLimpia.length === 13 && idLimpia !== '9999999999999') {
      tipoIdComprador = '04';
    } else {
      tipoIdComprador = '07';
    }
  } else if (tipoIdComprador === '04' && idLimpia.length === 10) {
    tipoIdComprador = '05';
  } else if (tipoIdComprador === '05' && idLimpia.length === 13) {
    tipoIdComprador = '04';
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">
  <infoTributaria>
    <ambiente>${company.ambiente}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${escapeXml(company.razonSocial)}</razonSocial>
    <nombreComercial>${escapeXml(company.nombreComercial || company.razonSocial)}</nombreComercial>
    <ruc>${escapeXml(company.ruc)}</ruc>
    <claveAcceso>${claveAcceso}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>${escapeXml(company.establecimiento)}</estab>
    <ptoEmi>${escapeXml(company.puntoEmision)}</ptoEmi>
    <secuencial>${secuencialStr}</secuencial>
    <dirMatriz>${escapeXml(company.dirMatriz)}</dirMatriz>
    ${company.regimenRimpe ? '<contribuyenteRimpe>CONTRIBUYENTE RÉGIMEN RIMPE</contribuyenteRimpe>' : ''}
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${fechaStr}</fechaEmision>
    <dirEstablecimiento>${escapeXml(company.dirEstablecimiento || company.dirMatriz)}</dirEstablecimiento>
    <obligadoContabilidad>${company.obligadoContabilidad}</obligadoContabilidad>
    <tipoIdentificacionComprador>${tipoIdComprador}</tipoIdentificacionComprador>
    <razonSocialComprador>${escapeXml(cliente.razonSocial)}</razonSocialComprador>
    <identificacionComprador>${escapeXml(cliente.identificacion)}</identificacionComprador>
    ${cliente.direccion ? `<direccionComprador>${escapeXml(cliente.direccion)}</direccionComprador>` : ''}
    <totalSinImpuestos>${totalSinImpuestos.toFixed(2)}</totalSinImpuestos>
    <totalDescuento>0.00</totalDescuento>
    <totalConImpuestos>
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>${codigoPorcentajeIva}</codigoPorcentaje>
        <baseImponible>${totalSinImpuestos.toFixed(2)}</baseImponible>
        <tarifa>${ivaRate.toFixed(2)}</tarifa>
        <valor>${totalIva.toFixed(2)}</valor>
      </totalImpuesto>
    </totalConImpuestos>
    <propina>0.00</propina>
    <importeTotal>${importeTotal.toFixed(2)}</importeTotal>
    <moneda>DOLAR</moneda>
    <pagos>
      <pago>
        <formaPago>${formaPagoSri}</formaPago>
        <total>${importeTotal.toFixed(2)}</total>
        <plazo>0</plazo>
        <unidadTiempo>dias</unidadTiempo>
      </pago>
    </pagos>
  </infoFactura>
  <detalles>`;

  lines.forEach((line) => {
    xml += `
    <detalle>
      <codigoPrincipal>${escapeXml(line.codigoPrincipal)}</codigoPrincipal>
      <descripcion>${escapeXml(line.descripcion)}</descripcion>
      <cantidad>${line.cantidad.toFixed(2)}</cantidad>
      <precioUnitario>${line.precioUnitarioSinIva.toFixed(4)}</precioUnitario>
      <descuento>0.00</descuento>
      <precioTotalSinImpuesto>${line.precioTotalSinImpuesto.toFixed(2)}</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>${codigoPorcentajeIva}</codigoPorcentaje>
          <tarifa>${ivaRate.toFixed(2)}</tarifa>
          <baseImponible>${line.precioTotalSinImpuesto.toFixed(2)}</baseImponible>
          <valor>${line.iva.toFixed(2)}</valor>
        </impuesto>
      </impuestos>
    </detalle>`;
  });

  xml += `
  </detalles>
  <infoAdicional>`;

  if (cliente.email) {
    xml += `
    <campoAdicional nombre="Email">${escapeXml(cliente.email)}</campoAdicional>`;
  }
  if (cliente.telefono) {
    xml += `
    <campoAdicional nombre="Telefono">${escapeXml(cliente.telefono)}</campoAdicional>`;
  }
  if (cliente.direccion) {
    xml += `
    <campoAdicional nombre="Direccion">${escapeXml(cliente.direccion)}</campoAdicional>`;
  }

  xml += `
    <campoAdicional nombre="Distribuidor">Distribuidora Aneth</campoAdicional>
  </infoAdicional>
</factura>`;

  return xml.trim();
}

export function buildNotaCreditoXml(params: {
  claveAcceso: string;
  secuencial: number;
  fechaEmision: Date;
  company: CompanyTaxProfile;
  cliente: {
    razonSocial: string;
    identificacion: string;
    tipoIdentificacion: '04' | '05' | '06' | '07';
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  facturaModificada: {
    numero: string; // ej. "001-001-000000100"
    fechaEmision: Date | string;
    total: number;
    subtotalSinImpuestos: number;
    iva: number;
  };
  items: CartItem[];
  motivo?: string;
  ivaRate?: number;
}): string {
  const {
    claveAcceso,
    secuencial,
    fechaEmision,
    company,
    cliente,
    facturaModificada,
    items,
    motivo = 'ANULACION DE PEDIDO Y COMPROBANTE',
    ivaRate = 15,
  } = params;

  const pad = (n: number | string, size: number) => String(n).padStart(size, '0');
  const secuencialStr = pad(secuencial, 9);
  const fechaStr = formatDateSRI(fechaEmision);

  const fechaFacturaDate =
    typeof facturaModificada.fechaEmision === 'string'
      ? new Date(facturaModificada.fechaEmision)
      : facturaModificada.fechaEmision;
  const fechaFacturaStr = formatDateSRI(fechaFacturaDate);

  const totalSinImpuestos = facturaModificada.subtotalSinImpuestos;
  const valorModificacion = facturaModificada.total;
  const totalIva = facturaModificada.iva;
  const codigoPorcentajeIva = ivaRate === 15 ? '4' : '0';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<notaCredito id="comprobante" version="1.1.0">
  <infoTributaria>
    <ambiente>${company.ambiente}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${escapeXml(company.razonSocial)}</razonSocial>
    <nombreComercial>${escapeXml(company.nombreComercial || company.razonSocial)}</nombreComercial>
    <ruc>${escapeXml(company.ruc)}</ruc>
    <claveAcceso>${claveAcceso}</claveAcceso>
    <codDoc>04</codDoc>
    <estab>${escapeXml(company.establecimiento)}</estab>
    <ptoEmi>${escapeXml(company.puntoEmision)}</ptoEmi>
    <secuencial>${secuencialStr}</secuencial>
    <dirMatriz>${escapeXml(company.dirMatriz)}</dirMatriz>
    ${company.regimenRimpe ? '<contribuyenteRimpe>CONTRIBUYENTE RÉGIMEN RIMPE</contribuyenteRimpe>' : ''}
  </infoTributaria>
  <infoNotaCredito>
    <fechaEmision>${fechaStr}</fechaEmision>
    <dirEstablecimiento>${escapeXml(company.dirEstablecimiento || company.dirMatriz)}</dirEstablecimiento>
    <tipoIdentificacionComprador>${cliente.tipoIdentificacion}</tipoIdentificacionComprador>
    <razonSocialComprador>${escapeXml(cliente.razonSocial)}</razonSocialComprador>
    <identificacionComprador>${escapeXml(cliente.identificacion)}</identificacionComprador>
    <obligadoContabilidad>${company.obligadoContabilidad}</obligadoContabilidad>
    <codDocModificado>01</codDocModificado>
    <numDocModificado>${escapeXml(facturaModificada.numero)}</numDocModificado>
    <fechaEmisionDocSustento>${fechaFacturaStr}</fechaEmisionDocSustento>
    <totalSinImpuestos>${totalSinImpuestos.toFixed(2)}</totalSinImpuestos>
    <valorModificacion>${valorModificacion.toFixed(2)}</valorModificacion>
    <moneda>DOLAR</moneda>
    <totalConImpuestos>
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>${codigoPorcentajeIva}</codigoPorcentaje>
        <baseImponible>${totalSinImpuestos.toFixed(2)}</baseImponible>
        <valor>${totalIva.toFixed(2)}</valor>
      </totalImpuesto>
    </totalConImpuestos>
    <motivo>${escapeXml(motivo)}</motivo>
  </infoNotaCredito>
  <detalles>`;

  const lines = expandCartItemsToFacturaLines(items, ivaRate);

  lines.forEach((line) => {
    xml += `
    <detalle>
      <codigoInterno>${escapeXml(line.codigoPrincipal)}</codigoInterno>
      <descripcion>${escapeXml(line.descripcion)}</descripcion>
      <cantidad>${line.cantidad.toFixed(2)}</cantidad>
      <precioUnitario>${line.precioUnitarioSinIva.toFixed(4)}</precioUnitario>
      <descuento>0.00</descuento>
      <precioTotalSinImpuesto>${line.precioTotalSinImpuesto.toFixed(2)}</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>${codigoPorcentajeIva}</codigoPorcentaje>
          <tarifa>${ivaRate.toFixed(2)}</tarifa>
          <baseImponible>${line.precioTotalSinImpuesto.toFixed(2)}</baseImponible>
          <valor>${line.iva.toFixed(2)}</valor>
        </impuesto>
      </impuestos>
    </detalle>`;
  });

  xml += `
  </detalles>
  <infoAdicional>
    <campoAdicional nombre="FacturaAfectada">${escapeXml(facturaModificada.numero)}</campoAdicional>
    <campoAdicional nombre="Distribuidor">Distribuidora Aneth</campoAdicional>
  </infoAdicional>
</notaCredito>`;

  return xml.trim();
}
