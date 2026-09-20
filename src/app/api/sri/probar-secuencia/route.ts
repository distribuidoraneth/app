import { NextRequest, NextResponse } from 'next/server';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { buildFacturaXml, DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import { signXmlXadesBes } from '@/lib/sri/signer';
import { enviarRecepcionSRI, consultarAutorizacionSRI } from '@/lib/sri/soapClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { secuencial = 1, ambiente = '1' } = body;

    const fecha = new Date();
    const mockOrder = {
      items: [
        {
          id: 'test-item-1',
          productOptionId: 'item-fructi-1',
          brand: 'Fructi',
          size: '500 ml' as const,
          container: 'Plástico' as const,
          flavorType: 'single' as const,
          selectedFlavor: 'Mora',
          quantityJavas: 1,
          quantityUnits: 0,
          unitsPerJava: 12,
          pricePerJava: 4.1,
          pricePerUnit: 0.3417,
          subtotal: 4.1,
          beverageType: 'Colas' as const,
          totalBottles: 12,
          imageUrl: '',
        },
      ],
      paymentMethod: 'cash' as const,
    };

    const mockClient = {
      fullName: 'CONSUMIDOR FINAL',
      taxId: '9999999999999',
      taxIdType: '07' as const,
      addressReference: 'Ambato',
      whatsappNumber: '+593999999999',
      email: 'facturas@distribuidoraaneth.com',
    };

    const claveAcceso = generarClaveAcceso({
      fecha,
      ruc: DEFAULT_TAX_PROFILE.ruc,
      ambiente: ambiente as '1' | '2',
      establecimiento: DEFAULT_TAX_PROFILE.establecimiento,
      puntoEmision: DEFAULT_TAX_PROFILE.puntoEmision,
      secuencial,
    });

    const rawXml = buildFacturaXml({
      claveAcceso,
      secuencial,
      fechaEmision: fecha,
      company: { ...DEFAULT_TAX_PROFILE, ambiente: ambiente as '1' | '2' },
      cliente: {
        razonSocial: mockClient.fullName,
        identificacion: mockClient.taxId,
        tipoIdentificacion: mockClient.taxIdType,
        direccion: mockClient.addressReference,
        telefono: mockClient.whatsappNumber,
        email: mockClient.email,
      },
      items: mockOrder.items,
      paymentMethod: mockOrder.paymentMethod,
      ivaRate: 15,
    });

    const signedXml = await signXmlXadesBes(rawXml);
    const recepcion = await enviarRecepcionSRI(signedXml, ambiente as '1' | '2');
    let autorizacion = null;

    if (recepcion.estado === 'RECIBIDA') {
      autorizacion = await consultarAutorizacionSRI(claveAcceso, ambiente as '1' | '2');
    }

    const yaRegistrado =
      (recepcion.error || '').includes('REGISTRADO') ||
      (recepcion.error || '').includes('SECUENCIAL') ||
      (recepcion.rawResponse || '').includes('REGISTRADO');

    return NextResponse.json({
      success: true,
      ambiente: ambiente === '1' ? 'Pruebas (Celcer)' : 'Producción (Cel)',
      secuencialProbado: secuencial,
      claveAcceso,
      recepcion,
      autorizacion,
      esValidoYDisponible: recepcion.estado === 'RECIBIDA',
      yaRegistrado,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error durante prueba de secuencia SRI' },
      { status: 500 }
    );
  }
}
