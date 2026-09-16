import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clientId = body?.clientId || body?.id;
    const qrToken = body?.qrToken;

    if (!clientId && !qrToken) {
      return NextResponse.json(
        { success: false, error: 'Se requiere clientId o qrToken para eliminar el cliente.' },
        { status: 400 }
      );
    }

    const sbAdmin = getServiceSupabase();

    // 1. Intentar eliminar por ID
    let deletedRows: any[] = [];
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

    // 2. Si no se encontró por ID y tenemos qrToken, intentar por qr_token
    if (deletedRows.length === 0 && qrToken) {
      const cleanToken = qrToken.split('|')[0];
      const { data, error } = await sbAdmin
        .from('clients')
        .delete()
        .ilike('qr_token', `${cleanToken}%`)
        .select();

      if (error) {
        console.error('Error al eliminar cliente por qr_token en Supabase:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      deletedRows = data || [];
    }

    console.log(`[API Delete Client] ID: ${clientId}, Filas eliminadas: ${deletedRows.length}`);

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
