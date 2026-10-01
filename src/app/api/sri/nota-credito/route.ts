import { NextRequest, NextResponse } from 'next/server';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { buildNotaCreditoXml, DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import { signXmlXadesBes } from '@/lib/sri/signer';
import { enviarRecepcionSRI, consultarAutorizacionSRI } from '@/lib/sri/soapClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoice, taxProfile = DEFAULT_TAX_PROFILE, motivo, secuencial = 1 } = body;

    if (!invoice) {
      return NextResponse.json(
        { error: 'Datos de factura original incompletos para emisión de Nota de Crédito' },
        { status: 400 }
      );
    }

    const fechaEmision = new Date();
    const envAmbiente = process.env.SRI_AMBIENTE || process.env.SRI_ENVIRONMENT || process.env.NEXT_PUBLIC_SRI_ENVIRONMENT;
    const ambiente: '1' | '2' = envAmbiente === '1' ? '1' : ((taxProfile.ambiente || '2') === '1' ? '1' : '2');

    // 1. Generar Clave de Acceso para Nota de Crédito (Tipo 04 - Módulo 11)
    const claveAcceso = generarClaveAcceso({
      fecha: fechaEmision,
      tipoComprobante: '04',
      ruc: taxProfile.ruc,
      ambiente,
      establecimiento: taxProfile.establecimiento,
      puntoEmision: taxProfile.puntoEmision,
      secuencial,
    });

    // 2. Construir XML Oficial SRI de Nota de Crédito v1.1.0
    const rawXml = buildNotaCreditoXml({
      claveAcceso,
      secuencial,
      fechaEmision,
      company: taxProfile,
      cliente: {
        razonSocial: invoice.clientName || invoice.businessName,
        identificacion: invoice.clientTaxId || '9999999999999',
        tipoIdentificacion: invoice.clientTaxIdType || '07',
        direccion: invoice.clientAddress,
        telefono: invoice.clientWhatsapp,
        email: invoice.clientEmail,
      },
      facturaModificada: {
        numero: invoice.invoiceNumber,
        fechaEmision: invoice.issuedAt,
        total: invoice.total,
        subtotalSinImpuestos: invoice.subtotal15,
        iva: invoice.tax,
      },
      items: invoice.items || [],
      motivo: motivo || 'ANULACION DE PEDIDO Y COMPROBANTE',
      ivaRate: 15,
    });

    // 3. Firmar Digitalmente con XAdES-BES (.p12 / PEM)
    const xml = await signXmlXadesBes(rawXml);

    // 4. Enviar a Recepción del SRI (SOAP)
    let sriRecepcion = await enviarRecepcionSRI(xml, ambiente);
    let sriAutorizacion = null;

    if (sriRecepcion.estado === 'RECIBIDA') {
      sriAutorizacion = await consultarAutorizacionSRI(claveAcceso, ambiente);
    }

    return NextResponse.json({
      success: true,
      tipoComprobante: '04',
      claveAcceso,
      secuencialCompleto: `${taxProfile.establecimiento}-${taxProfile.puntoEmision}-${String(secuencial).padStart(9, '0')}`,
      xml,
      sriStatus: sriAutorizacion?.estado || sriRecepcion.estado,
      numeroAutorizacion: sriAutorizacion?.numeroAutorizacion || claveAcceso,
      fechaAutorizacion: sriAutorizacion?.fechaAutorizacion || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error en API Nota de Crédito SRI:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno en emisión de Nota de Crédito' },
      { status: 500 }
    );
  }
}
