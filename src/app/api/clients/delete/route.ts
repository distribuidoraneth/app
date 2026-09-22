import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const sbAdmin = getServiceSupabase();

    // 1. Verificación de Seguridad: Requiere sesión autenticada de Supabase Auth
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado: se requiere token de sesión.' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await sbAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Sesión inválida o expirada.' },
        { status: 403 }
      );
    }

    // 2. Extracción y Saneamiento de Parámetros
    const body = await req.json().catch(() => ({}));
    const rawClientId = body?.clientId || body?.id;
    const rawQrToken = body?.qrToken;

    const clientId = typeof rawClientId === 'string' ? rawClientId.trim() : '';
    const qrToken = typeof rawQrToken === 'string' ? rawQrToken.trim() : '';

    if (!clientId && !qrToken) {
      return NextResponse.json(
        { success: false, error: 'Se requiere clientId o qrToken válido para eliminar el cliente.' },
        { status: 400 }
      );
    }

    // 3. Eliminación Segura: Cero caracteres comodín (%) para prevenir inyección o borrado masivo
    let deletedRows: any[] = [];

    // Intento 1: Por ID exacto
    if (clientId) {
      const { data, error } = await sbAdmin
        .from('clients')
        .delete()
        .eq('id', clientId)
        .select();

      if (error) {
        console.error('Error al eliminar cliente por ID en Supabase:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      deletedRows = data || [];
    }

    // Intento 2: Por qr_token exacto o prefijo exacto (mínimo 6 caracteres alfanuméricos)
    if (deletedRows.length === 0 && qrToken) {
      const cleanToken = qrToken.split('|')[0].trim();

      if (cleanToken.length < 5 || cleanToken.includes('%') || cleanToken.includes('_')) {
        return NextResponse.json(
          { success: false, error: 'Token de cliente no válido para eliminación.' },
          { status: 400 }
        );
      }

      // Buscar coincidencia exacta primero
      const { data: exactData, error: exactErr } = await sbAdmin
        .from('clients')
        .delete()
        .eq('qr_token', cleanToken)
        .select();

      if (exactErr) {
        return NextResponse.json({ success: false, error: exactErr.message }, { status: 500 });
      }

      deletedRows = exactData || [];

      // Si tiene tier adjunto, probar con prefijo pero delimitado estrictamente
      if (deletedRows.length === 0) {
        const { data: prefixData, error: prefixErr } = await sbAdmin
          .from('clients')
          .delete()
          .like('qr_token', `${cleanToken}|%`)
          .select();

        if (prefixErr) {
          return NextResponse.json({ success: false, error: prefixErr.message }, { status: 500 });
        }
        deletedRows = prefixData || [];
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedRows.length,
      deletedClients: deletedRows,
    });
  } catch (err: any) {
    console.error('Excepción en /api/clients/delete:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error interno del servidor al eliminar cliente' },
      { status: 500 }
    );
  }
}
