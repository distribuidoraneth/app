import { NextRequest, NextResponse } from 'next/server';
import { consultarAutorizacionSRI } from '@/lib/sri/soapClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { claveAcceso, ambiente: requestedAmbiente } = body;

    if (!claveAcceso || typeof claveAcceso !== 'string' || claveAcceso.length !== 49) {
      return NextResponse.json(
        { error: 'Clave de acceso inválida (debe contener 49 dígitos exactos)' },
        { status: 400 }
      );
    }

    // Auto-detectar ambiente desde el dígito 24 (índice 23) de la clave de acceso del SRI
    const claveAmbiente = claveAcceso.charAt(23) === '2' ? '2' : claveAcceso.charAt(23) === '1' ? '1' : null;
    const envAmbiente = process.env.SRI_AMBIENTE || process.env.SRI_ENVIRONMENT || process.env.NEXT_PUBLIC_SRI_ENVIRONMENT;
    const ambiente: '1' | '2' = requestedAmbiente || claveAmbiente || (envAmbiente === '1' ? '1' : '2');

    const resultado = await consultarAutorizacionSRI(claveAcceso, ambiente);

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
