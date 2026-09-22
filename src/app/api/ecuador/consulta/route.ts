import { NextRequest, NextResponse } from 'next/server';

const ECUADOR_API_BASE = 'https://api.ecuadorapi.com/api/v1';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taxIdRaw = searchParams.get('taxId') || searchParams.get('ruc') || searchParams.get('cedula');

    if (!taxIdRaw) {
      return NextResponse.json(
        { success: false, error: 'Parámetro Cédula o RUC requerido.' },
        { status: 200 }
      );
    }

    const taxId = taxIdRaw.replace(/\D/g, '').trim();
    const apiKey = process.env.ECUADOR_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Servicio de consulta no configurado en el servidor.' },
        { status: 500 }
      );
    }

    if (taxId.length === 13) {
      // 1. Consulta RUC
      const res = await fetch(`${ECUADOR_API_BASE}/rucs/${taxId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        return NextResponse.json({
          success: false,
          error: errJson?.message || `No se encontró información en el SRI para el RUC ${taxId}`,
        });
      }

      const json = await res.json();
      const rucData = json.data;

      const businessName =
        rucData?.trade_name ||
        rucData?.establishments?.[0]?.commercial_name ||
        rucData?.business_name ||
        '';

      const mainEstablishment = rucData?.establishments?.find((e: { is_headquarters?: boolean }) => e.is_headquarters) || rucData?.establishments?.[0];
      const address = mainEstablishment?.address || rucData?.address || '';

      return NextResponse.json({
        success: true,
        taxId,
        taxIdType: '04', // 04: RUC
        fullName: rucData?.business_name || '',
        businessName: businessName !== rucData?.business_name ? businessName : '',
        addressReference: address,
        status: rucData?.status || 'ACTIVO',
        taxpayerType: rucData?.taxpayer_type || 'PERSONA NATURAL',
        economicActivity: rucData?.economic_activity || '',
        gender: rucData?.taxpayer_type?.includes('JURIDICA') ? 'Empresa' : 'Hombre',
        birthDate: '',
      });
    } else if (taxId.length === 10) {
      // 2. Consulta Cédula
      const res = await fetch(`${ECUADOR_API_BASE}/cedulas/${taxId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        return NextResponse.json({
          success: false,
          error: errJson?.message || `No se encontró información en el Registro Civil para la Cédula ${taxId}`,
        });
      }

      const json = await res.json();
      const cedulaData = json.data;

      const rawGender = (cedulaData?.gender || '').toLowerCase();
      const gender = rawGender.includes('female') || rawGender.includes('muj') ? 'Mujer' : 'Hombre';

      const birthPlace = cedulaData?.birth_place;
      const address = [birthPlace?.province?.name, birthPlace?.canton?.name, birthPlace?.parish?.name]
        .filter(Boolean)
        .join(', ');

      return NextResponse.json({
        success: true,
        taxId,
        taxIdType: '05', // 05: Cédula
        fullName: cedulaData?.full_name || `${cedulaData?.first_name || ''} ${cedulaData?.last_name || ''}`.trim(),
        businessName: '',
        addressReference: address,
        gender,
        birthDate: cedulaData?.birth_date || cedulaData?.dob || '',
        status: 'ACTIVO',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Ingresa 10 dígitos para Cédula o 13 dígitos para RUC.',
      });
    }
  } catch (error) {
    console.error('Error en consulta EcuadorAPI:', error);
    return NextResponse.json({
      success: false,
      error: 'No se pudo consultar automáticamente. Completa los datos manualmente.',
    });
  }
}
