/**
 * Generador de XML para Facturación Electrónica SRI Ecuador (Esquema v1.1.0)
 */

import { CartItem, CompanyTaxProfile } from '@/types';

export const DEFAULT_TAX_PROFILE: CompanyTaxProfile = {
  ruc: '1792345678001',
  razonSocial: 'DISTRIBUIDORA ANETH BEVERAGES S.A.S.',
  nombreComercial: 'DISTRIBUIDORA ANETH',
  dirMatriz: 'Av. 6 de Diciembre y Orellana, Quito - Ecuador',
  dirEstablecimiento: 'Av. 6 de Diciembre y Orellana, Quito - Ecuador',
  establecimiento: '001',
  puntoEmision: '001',
  ambiente: '1', // Por defecto pruebas
  obligadoContabilidad: 'NO',
  regimenRimpe: true,
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

  // Calcular subtotales
  const totalSinImpuestos = items.reduce((sum, i) => sum + i.subtotal, 0);
  const ivaFactor = ivaRate / 100;
  const totalIva = Number((totalSinImpuestos * ivaFactor).toFixed(2));
  const importeTotal = Number((totalSinImpuestos + totalIva).toFixed(2));

  // Forma de pago SRI: 01 = Efectivo, 20 = Otros con utilización del sistema financiero
  const formaPagoSri = paymentMethod === 'cash' ? '01' : '20';

  // Código de porcentaje de IVA: 4 = 15% (vigente en Ecuador), 0 = 0%
  const codigoPorcentajeIva = ivaRate === 15 ? '4' : '0';

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
    <tipoIdentificacionComprador>${cliente.tipoIdentificacion}</tipoIdentificacionComprador>
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

  items.forEach((item) => {
    const descripcion = `${item.beverageType} ${item.size} ${item.container} - ${
      item.flavorType === 'single' ? item.selectedFlavor : 'Surtido'
    } (${item.quantityJavas > 0 ? `${item.quantityJavas} javas` : ''}${
      item.quantityJavas > 0 && item.quantityUnits > 0 ? ' + ' : ''
    }${item.quantityUnits > 0 ? `${item.quantityUnits} unidades` : ''})`;

    const cantidad = item.totalBottles || (item.quantityJavas * item.unitsPerJava);
    const precioUnitario = item.pricePerUnit || Number((item.pricePerJava / item.unitsPerJava).toFixed(4));
    const subtotalItem = item.subtotal;
    const ivaItem = Number((subtotalItem * ivaFactor).toFixed(2));

    xml += `
    <detalle>
      <codigoPrincipal>${escapeXml(item.productOptionId)}</codigoPrincipal>
      <descripcion>${escapeXml(descripcion)}</descripcion>
      <cantidad>${cantidad.toFixed(2)}</cantidad>
      <precioUnitario>${precioUnitario.toFixed(4)}</precioUnitario>
      <descuento>0.00</descuento>
      <precioTotalSinImpuesto>${subtotalItem.toFixed(2)}</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>${codigoPorcentajeIva}</codigoPorcentaje>
          <tarifa>${ivaRate.toFixed(2)}</tarifa>
          <baseImponible>${subtotalItem.toFixed(2)}</baseImponible>
          <valor>${ivaItem.toFixed(2)}</valor>
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
    <campoAdicional nombre="Distribuidor">Distribuidora Aneth Oficial</campoAdicional>
  </infoAdicional>
</factura>`;

  return xml.trim();
}
