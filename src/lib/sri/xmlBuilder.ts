/**
 * Generador de XML para Facturación Electrónica SRI Ecuador (Esquema v1.1.0)
 */

import type { CartItem, CompanyTaxProfile } from '@/types';
import { formatProductSku, expandCartItemsToFacturaLines } from '@/lib/utils/formatters';

export const DEFAULT_TAX_PROFILE: CompanyTaxProfile = {
  ruc: '1803013810001',
  razonSocial: 'ANDRADE CONSTANTE ANA ELIZABETH',
  nombreComercial: 'ANETH DISTRIBUCIONES',
  dirMatriz: 'AV. ATAHUALPA S/N Y TEODORO SOLIS, AMBATO, TUNGURAHUA',
  dirEstablecimiento: 'AV. ATAHUALPA S/N Y TEODORO SOLIS, AMBATO, TUNGURAHUA',
  establecimiento: process.env.SRI_ESTABLECIMIENTO || '001',
  puntoEmision: process.env.SRI_PUNTO_EMISION || '001',
  ambiente: ((process.env.NEXT_PUBLIC_SRI_ENVIRONMENT || process.env.SRI_ENVIRONMENT || process.env.SRI_AMBIENTE || '2') === '1' ? '1' : '2') as '1' | '2', // Producción (2)
  obligadoContabilidad: 'NO',
  regimenRimpe: false,
};

export interface SriPaymentMethodInfo {
  code: string;
  name: string;
  isCash: boolean;
}

export function getSriPaymentMethodInfo(method?: string | null): SriPaymentMethodInfo {
  const clean = (method || '').toLowerCase().trim();
  // 1. Efectivo, Crédito directo (Fiado/Plazo) y Pagos Parciales:
  // En Ecuador y normativa SRI, el crédito directo concedido por la distribuidora al cliente
  // (sin banco ni financiera) es legalmente '01 - SIN UTILIZACION DEL SISTEMA FINANCIERO'.
  if (
    clean === 'cash' ||
    clean === 'efectivo' ||
    clean === 'contado' ||
    clean === 'billete' ||
    clean === 'credit' ||
    clean === 'credito' ||
    clean === 'crédito' ||
    clean === 'fiado' ||
    clean === 'plazo' ||
    clean === 'parcial' ||
    clean === 'pago_parcial' ||
    clean === 'saldo' ||
    clean === '01' ||
    !clean
  ) {
    return {
      code: '01',
      name: '01 - SIN UTILIZACION DEL SISTEMA FINANCIERO',
      isCash: true,
    };
  }

  // 2. Transferencias bancarias, DeUna, Depósitos, Cheques:
  if (
    clean === 'transfer' ||
    clean === 'transferencia' ||
    clean === 'deuna' ||
    clean === 'de una' ||
    clean === 'deposito' ||
    clean === 'depósito' ||
    clean === 'cheque' ||
    clean === 'banco' ||
    clean === '20'
  ) {
    return {
      code: '20',
      name: '20 - OTROS CON UTILIZACION DEL SISTEMA FINANCIERO',
      isCash: false,
    };
  }

  // 3. Tarjeta de Débito Bancaria:
  if (clean === 'debito' || clean === 'tarjeta_debito' || clean === 'tarjeta de debito' || clean === '16') {
    return {
      code: '16',
      name: '16 - TARJETA DE DEBITO',
      isCash: false,
    };
  }

  // 4. Tarjeta de Crédito Bancaria (POS/Voucher Datafast/Medianet):
  if (
    clean === 'tarjeta_credito' ||
    clean === 'tarjeta de credito' ||
    clean === 'tarjeta de crédito' ||
    clean === 'tc' ||
    clean === 'voucher' ||
    clean === '19'
  ) {
    return {
      code: '19',
      name: '19 - TARJETA DE CREDITO',
      isCash: false,
    };
  }

  return {
    code: '01',
    name: '01 - SIN UTILIZACION DEL SISTEMA FINANCIERO',
    isCash: true,
  };
}

export function escapeXml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
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
  paymentMethod?: string;
  ivaRate?: number; // 0 o 15
}): string {
  const {
    claveAcceso,
    secuencial,
    fechaEmision,
    company,
    cliente,
    items,
    paymentMethod = 'cash',
    ivaRate = 15,
  } = params;

  const pad = (n: number | string, size: number) => String(n).padStart(size, '0');
  const secuencialStr = pad(secuencial, 9);
  const fechaStr = formatDateSRI(fechaEmision);

  // Desglose oficial de ítems según Opción 1:
  // Si un ítem tiene tanto Packs como Unidades sueltas, se desglosa en líneas discretas
  // con SKUs estandarizados (ej: FRU-500-PAQ y FRU-500-UND) y sumas tributarias exactas.
  let lines = expandCartItemsToFacturaLines(items, ivaRate);

  // El esquema SRI v1.1.0 exige al menos 1 línea en <detalles>
  if (!lines || lines.length === 0) {
    const baseFallback = ivaRate > 0 ? Number((1.0 / (1 + ivaRate / 100)).toFixed(2)) : 1.0;
    const ivaFallback = Number((1.0 - baseFallback).toFixed(2));
    lines = [
      {
        codigoPrincipal: 'PROD-01',
        descripcion: 'VENTA GENERAL / BEBIDAS',
        cantidad: 1,
        precioUnitarioSinIva: baseFallback,
        descuento: 0,
        precioTotalSinImpuesto: baseFallback,
        iva: ivaFallback,
        subtotalConIva: 1.0,
        tipo: 'pack',
        unidadMedida: 'pack',
      },
    ];
  }

  const totalSinImpuestos = Number(lines.reduce((sum, l) => sum + l.precioTotalSinImpuesto, 0).toFixed(2));
  const totalIva = Number(lines.reduce((sum, l) => sum + l.iva, 0).toFixed(2));
  const importeTotal = Number((totalSinImpuestos + totalIva).toFixed(2));

  // Forma de pago SRI estricta: 01 = Efectivo (Sin utilización del sist. financiero), 20 = Transferencia/DeUna
  const paymentInfo = getSriPaymentMethodInfo(paymentMethod);
  const formaPagoSri = paymentInfo.code;

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

  const razonSocialCliente = (
    cliente.razonSocial ||
    (idLimpia === '9999999999999' || !idLimpia ? 'CONSUMIDOR FINAL' : 'CLIENTE REGISTRADO')
  ).trim() || 'CONSUMIDOR FINAL';
  const identificacionCliente = (cliente.identificacion || '9999999999999').trim() || '9999999999999';

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
    <razonSocialComprador>${escapeXml(razonSocialCliente)}</razonSocialComprador>
    <identificacionComprador>${escapeXml(identificacionCliente)}</identificacionComprador>
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
    const isPromoLine = Boolean(line.isPromo) || line.precioTotalSinImpuesto === 0;
    const precioUnitario = isPromoLine
      ? (line.precioUnitarioSinIva > 0 ? line.precioUnitarioSinIva : 0.0001)
      : line.precioUnitarioSinIva;
    let desc = line.descripcion;
    if (isPromoLine && !desc.includes('[BONIFICACIÓN GRATIS]')) {
      desc += ' [BONIFICACIÓN GRATIS]';
    }

    xml += `
    <detalle>
      <codigoPrincipal>${escapeXml(line.codigoPrincipal)}</codigoPrincipal>
      <descripcion>${escapeXml(desc)}</descripcion>
      <cantidad>${line.cantidad.toFixed(2)}</cantidad>
      <precioUnitario>${precioUnitario.toFixed(4)}</precioUnitario>
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
    <campoAdicional nombre="Distribuidor">ANETH Distribuciones</campoAdicional>
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
    const isPromoLine = Boolean(line.isPromo) || line.precioTotalSinImpuesto === 0;
    const precioUnitario = isPromoLine
      ? (line.precioUnitarioSinIva > 0 ? line.precioUnitarioSinIva : 0.0001)
      : line.precioUnitarioSinIva;
    let desc = line.descripcion;
    if (isPromoLine && !desc.includes('[BONIFICACIÓN GRATIS]')) {
      desc += ' [BONIFICACIÓN GRATIS]';
    }

    xml += `
    <detalle>
      <codigoInterno>${escapeXml(line.codigoPrincipal)}</codigoInterno>
      <descripcion>${escapeXml(desc)}</descripcion>
      <cantidad>${line.cantidad.toFixed(2)}</cantidad>
      <precioUnitario>${precioUnitario.toFixed(4)}</precioUnitario>
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
    <campoAdicional nombre="Distribuidor">ANETH Distribuciones</campoAdicional>
  </infoAdicional>
</notaCredito>`;

  return xml.trim();
}
