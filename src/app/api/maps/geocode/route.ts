import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ success: false, error: 'Coordenadas requeridas' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`
    );
    const data = await res.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Find the best street or route level address
      const bestResult =
        data.results.find((r: any) =>
          r.types.includes('street_address') || r.types.includes('route') || r.types.includes('premise')
        ) || data.results[0];

      let address = bestResult.formatted_address || '';
      // Remove Google plus code prefix if present (e.g. "PFR8+3JF, ")
      address = address.replace(/^[A-Z0-9\+]+,\s*/, '');

      return NextResponse.json({
        success: true,
        address,
        placeId: bestResult.place_id,
        raw: bestResult,
      });
    }

    return NextResponse.json({
      success: false,
      error: data.error_message || 'No se pudo obtener la dirección de Google Maps.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error en el servicio de geocodificación' },
      { status: 500 }
    );
  }
}
