import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/admin';
import { DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MIN_BASE_SEQUENCE = 119;

export async function GET() {
  try {
    const sbAdmin = getServiceSupabase();
    const ruc = DEFAULT_TAX_PROFILE.ruc;

    const { data, error } = await sbAdmin
      .from('company_tax_profiles')
      .select('id, ruc, current_secuencial')
      .eq('ruc', ruc)
      .maybeSingle();

    if (error) {
      console.warn('[API Sequence] Error al consultar company_tax_profiles:', error.message);
      return NextResponse.json({
        current_secuencial: MIN_BASE_SEQUENCE,
        next_secuencial: MIN_BASE_SEQUENCE + 1,
      });
    }

    let currentSecuencial = data?.current_secuencial ? Number(data.current_secuencial) : MIN_BASE_SEQUENCE;
    if (currentSecuencial < MIN_BASE_SEQUENCE) {
      currentSecuencial = MIN_BASE_SEQUENCE;
    }

    // Si no existía fila, crearla
    if (!data) {
      await sbAdmin.from('company_tax_profiles').insert({
        ruc,
        razon_social: DEFAULT_TAX_PROFILE.razonSocial,
        nombre_comercial: DEFAULT_TAX_PROFILE.nombreComercial,
        establecimiento: DEFAULT_TAX_PROFILE.establecimiento || '001',
        punto_emision: DEFAULT_TAX_PROFILE.puntoEmision || '001',
        dir_matriz: DEFAULT_TAX_PROFILE.dirMatriz,
        current_secuencial: currentSecuencial,
      });
    }

    return NextResponse.json({
      current_secuencial: currentSecuencial,
      next_secuencial: currentSecuencial + 1,
    });
  } catch (err: any) {
    console.error('[API Sequence GET] Excepción:', err);
    return NextResponse.json({
      current_secuencial: MIN_BASE_SEQUENCE,
      next_secuencial: MIN_BASE_SEQUENCE + 1,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sbAdmin = getServiceSupabase();
    const ruc = DEFAULT_TAX_PROFILE.ruc;

    // 1. Soporte para obtención atómica del siguiente secuencial mediante RPC de Postgres
    if (body?.action === 'next') {
      try {
        const { data: rpcSeq, error: rpcErr } = await sbAdmin.rpc('get_next_invoice_secuencial', {
          p_ruc: ruc,
        });
        if (!rpcErr && rpcSeq) {
          const val = Number(rpcSeq);
          return NextResponse.json({
            success: true,
            current_secuencial: val,
            next_secuencial: val + 1,
          });
        }
      } catch {
        // Fallback a lógica de lectura/actualización directa si la función no ha sido migrada aún
      }
    }

    const newSeq = Number(body?.secuencial);

    if (isNaN(newSeq) || newSeq < MIN_BASE_SEQUENCE) {
      return NextResponse.json(
        { success: false, error: `El secuencial debe ser un número >= ${MIN_BASE_SEQUENCE}` },
        { status: 400 }
      );
    }

    const { data: existing } = await sbAdmin
      .from('company_tax_profiles')
      .select('id, current_secuencial')
      .eq('ruc', ruc)
      .maybeSingle();

    const force = Boolean(body?.force);
    const finalSeq = force ? newSeq : newSeq; // Respetar el número indicado explícitamente

    if (existing) {
      await sbAdmin
        .from('company_tax_profiles')
        .update({
          current_secuencial: finalSeq,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await sbAdmin.from('company_tax_profiles').insert({
        ruc,
        razon_social: DEFAULT_TAX_PROFILE.razonSocial,
        nombre_comercial: DEFAULT_TAX_PROFILE.nombreComercial,
        establecimiento: DEFAULT_TAX_PROFILE.establecimiento || '001',
        punto_emision: DEFAULT_TAX_PROFILE.puntoEmision || '001',
        dir_matriz: DEFAULT_TAX_PROFILE.dirMatriz,
        current_secuencial: finalSeq,
      });
    }

    return NextResponse.json({
      success: true,
      current_secuencial: finalSeq,
      next_secuencial: finalSeq + 1,
    });
  } catch (err: any) {
    console.error('[API Sequence POST] Excepción:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al actualizar secuencial' },
      { status: 500 }
    );
  }
}
