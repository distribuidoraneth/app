import { NextRequest, NextResponse } from 'next/server';
import { consultarAutorizacionSRI } from '@/lib/sri/soapClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { claveAcceso, ambiente = '1' } = body;

    if (!claveAcceso || typeof claveAcceso !== 'string' || claveAcceso.length !== 49) {
      return NextResponse.json(
        { error: 'Clave de acceso inválida (debe contener 49 dígitos exactos)' },
        { status: 400 }
      );
    }

    const resultado = await consultarAutorizacionSRI(claveAcceso, (ambiente as '1' | '2') || '1');

    return NextResponse.json({
      success: resultado.estado === 'AUTORIZADO',
      claveAcceso,
      ambiente,
      estado: resultado.estado,
      numeroAutorizacion: resultado.numeroAutorizacion,
      fechaAutorizacion: resultado.fechaAutorizacion,
      xmlAutorizado: resultado.xmlAutorizado,
      error: resultado.error,
      rawResponse: resultado.rawResponse,
    });
  } catch (error: any) {
    console.error('Error al consultar autorización SRI:', error);
    return NextResponse.json(
      { error: error?.message || 'Error de conexión con el WebService del SRI' },
      { status: 500 }
    );
  }
}
