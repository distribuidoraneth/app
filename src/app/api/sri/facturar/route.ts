import { NextRequest, NextResponse } from 'next/server';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { buildFacturaXml, DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import { enviarRecepcionSRI, consultarAutorizacionSRI } from '@/lib/sri/soapClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order, client, taxProfile = DEFAULT_TAX_PROFILE, secuencial = 1 } = body;

    if (!order || !client) {
      return NextResponse.json(
        { error: 'Datos de pedido o cliente incompletos' },
        { status: 400 }
      );
    }

    const fechaEmision = new Date();
    const ambiente = taxProfile.ambiente || '1';

    // 1. Generar Clave de Acceso de 49 Dígitos (Módulo 11)
    const claveAcceso = generarClaveAcceso({
      fecha: fechaEmision,
      ruc: taxProfile.ruc,
      ambiente,
      establecimiento: taxProfile.establecimiento,
      puntoEmision: taxProfile.puntoEmision,
      secuencial,
    });

    // 2. Construir XML Oficial SRI v1.1.0
    const xml = buildFacturaXml({
      claveAcceso,
      secuencial,
      fechaEmision,
      company: taxProfile,
      cliente: {
        razonSocial: client.fullName || client.businessName,
        identificacion: client.taxId || '9999999999999',
        tipoIdentificacion: client.taxIdType || '07',
        direccion: client.addressReference,
        telefono: client.whatsappNumber,
        email: client.email,
      },
      items: order.items || [],
      paymentMethod: order.paymentMethod || 'cash',
      ivaRate: 15,
    });

    // 3. Enviar a Recepción del SRI (SOAP)
    let sriRecepcion = await enviarRecepcionSRI(xml, ambiente);
    let sriAutorizacion = null;

    // Si fue recibida, consultar autorización
    if (sriRecepcion.estado === 'RECIBIDA') {
      sriAutorizacion = await consultarAutorizacionSRI(claveAcceso, ambiente);
    }

    return NextResponse.json({
      success: true,
      claveAcceso,
      secuencialCompleto: `${taxProfile.establecimiento}-${taxProfile.puntoEmision}-${String(secuencial).padStart(9, '0')}`,
      xml,
      sriStatus: sriAutorizacion?.estado || sriRecepcion.estado,
      numeroAutorizacion: sriAutorizacion?.numeroAutorizacion || claveAcceso,
      fechaAutorizacion: sriAutorizacion?.fechaAutorizacion || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error en API Facturación SRI:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno en emisión de factura SRI' },
      { status: 500 }
    );
  }
}
