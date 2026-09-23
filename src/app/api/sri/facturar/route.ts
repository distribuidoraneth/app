import { NextRequest, NextResponse } from 'next/server';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { buildFacturaXml, DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import { signXmlXadesBes } from '@/lib/sri/signer';
import { enviarRecepcionSRI, consultarAutorizacionSRI } from '@/lib/sri/soapClient';
import { getServiceSupabase } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order,
      client,
      taxProfile = DEFAULT_TAX_PROFILE,
      secuencial = 1,
      claveAcceso: customClaveAcceso,
    } = body;

    if (!order || !client) {
      return NextResponse.json(
        { error: 'Datos de pedido o cliente incompletos' },
        { status: 400 }
      );
    }

    // 1. Obtener perfil tributario oficial desde Supabase con fallback a DEFAULT_TAX_PROFILE
    let activeProfile = { ...DEFAULT_TAX_PROFILE, ...taxProfile };
    try {
      const sbAdmin = getServiceSupabase();
      const { data: dbProfile } = await sbAdmin
        .from('company_tax_profiles')
        .select('*')
        .eq('ruc', activeProfile.ruc)
        .maybeSingle();

      if (dbProfile) {
        activeProfile = {
          ...activeProfile,
          ambiente: (dbProfile.ambiente || activeProfile.ambiente || '2') as '1' | '2',
          establecimiento: dbProfile.establecimiento || activeProfile.establecimiento,
          puntoEmision: dbProfile.punto_emision || activeProfile.puntoEmision,
          razonSocial: dbProfile.razon_social || activeProfile.razonSocial,
          nombreComercial: dbProfile.nombre_comercial || activeProfile.nombreComercial,
          dirMatriz: dbProfile.dir_matriz || activeProfile.dirMatriz,
          dirEstablecimiento: dbProfile.dir_establecimiento || activeProfile.dirEstablecimiento,
          obligadoContabilidad: dbProfile.obligado_contabilidad || activeProfile.obligadoContabilidad,
          regimenRimpe: dbProfile.regimen_rimpe ?? activeProfile.regimenRimpe,
        };
      }
    } catch (profErr) {
      console.warn('[API facturar] Error al consultar company_tax_profiles:', profErr);
    }

    const ambiente: '1' | '2' = (activeProfile.ambiente || process.env.NEXT_PUBLIC_SRI_ENVIRONMENT || process.env.SRI_ENVIRONMENT || '2') === '1' ? '1' : '2';
    activeProfile.ambiente = ambiente;

    let claveAcceso = customClaveAcceso;
    let fechaEmision = new Date();

    if (customClaveAcceso && typeof customClaveAcceso === 'string' && customClaveAcceso.length === 49) {
      // Sincronizar fecha con la clave provista para que coincida 100% con la firma
      const dia = parseInt(customClaveAcceso.slice(0, 2), 10);
      const mes = parseInt(customClaveAcceso.slice(2, 4), 10);
      const anio = parseInt(customClaveAcceso.slice(4, 8), 10);
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio)) {
        fechaEmision = new Date(anio, mes - 1, dia);
      }
    } else {
      claveAcceso = generarClaveAcceso({
        fecha: fechaEmision,
        ruc: activeProfile.ruc,
        ambiente,
        establecimiento: activeProfile.establecimiento,
        puntoEmision: activeProfile.puntoEmision,
        secuencial,
      });
    }

    // 2. Construir XML Oficial SRI v1.1.0
    const rawXml = buildFacturaXml({
      claveAcceso,
      secuencial,
      fechaEmision,
      company: activeProfile,
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

    // 3. Firmar Digitalmente con XAdES-BES (.p12 / .pem)
    const xml = await signXmlXadesBes(rawXml);

    // 4. Enviar a Recepción del SRI (SOAP)
    let sriRecepcion = await enviarRecepcionSRI(xml, ambiente);
    let sriAutorizacion = null;

    // Si fue recibida, esperar 1.5s y consultar autorización
    if (sriRecepcion.estado === 'RECIBIDA') {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      sriAutorizacion = await consultarAutorizacionSRI(claveAcceso, ambiente);
    }

    const finalStatus =
      sriAutorizacion?.estado === 'AUTORIZADO'
        ? 'AUTORIZADO'
        : sriRecepcion.estado === 'RECIBIDA'
        ? (sriAutorizacion?.estado || 'RECIBIDA')
        : 'DEVUELTA';

    const errorMessage =
      sriRecepcion.estado === 'DEVUELTA'
        ? sriRecepcion.error
        : sriAutorizacion?.estado === 'NO AUTORIZADO'
        ? sriAutorizacion.error
        : undefined;

    // Si se emitió o procesó un secuencial válido, asegurar persistencia en company_tax_profiles
    if (secuencial && Number(secuencial) >= 119) {
      try {
        const sbAdmin = getServiceSupabase();
        const { data: existing } = await sbAdmin
          .from('company_tax_profiles')
          .select('id, current_secuencial')
          .eq('ruc', taxProfile.ruc)
          .maybeSingle();

        if (existing && Number(secuencial) > (existing.current_secuencial || 0)) {
          await sbAdmin
            .from('company_tax_profiles')
            .update({
              current_secuencial: Number(secuencial),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        }
      } catch (seqErr) {
        console.warn('[API facturar] No se pudo actualizar secuencial en company_tax_profiles:', seqErr);
      }
    }

    return NextResponse.json({
      success: finalStatus === 'AUTORIZADO' || finalStatus === 'RECIBIDA' || finalStatus === 'EN PROCESO',
      claveAcceso,
      secuencialCompleto: `${activeProfile.establecimiento}-${activeProfile.puntoEmision}-${String(secuencial).padStart(9, '0')}`,
      xml,
      sriStatus: finalStatus,
      numeroAutorizacion: sriAutorizacion?.numeroAutorizacion || claveAcceso,
      fechaAutorizacion: sriAutorizacion?.fechaAutorizacion || new Date().toISOString(),
      error: errorMessage,
      rawRecepcion: sriRecepcion,
      rawAutorizacion: sriAutorizacion,
    });
  } catch (error: any) {
    console.error('Error en API Facturación SRI:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno en emisión de factura SRI' },
      { status: 500 }
    );
  }
}
