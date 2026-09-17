import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ success: false, error: 'Coordenadas requeridas' }, { status: 400 });
    }

    const DEFAULT_GOOGLE_KEY = 'AIzaSyBxdOiBsT-hmDUzpwhLg8BSmjvgCof0uI0';
    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      DEFAULT_GOOGLE_KEY;

    let address = '';
    let placeId = '';

    // 1. Intento primario con Google Maps Geocoding API
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`
      );
      const data = await res.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const bestResult =
          data.results.find((r: any) =>
            r.types.includes('street_address') || r.types.includes('route') || r.types.includes('premise')
          ) || data.results[0];

        address = bestResult.formatted_address || '';
        address = address.replace(/^[A-Z0-9\+]+,\s*/, ''); // Limpiar Plus Codes
        placeId = bestResult.place_id || '';

        return NextResponse.json({
          success: true,
          address,
          placeId,
          source: 'google',
        });
      }
    } catch (gErr) {
      console.warn('Aviso: Error en consulta Google Maps Geocoding:', gErr);
    }

    // 2. Fallback secundario con OpenStreetMap (Nominatim) si Google Maps falla o no tiene cobertura
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'DistribuidoraAnethApp/1.0' } }
      );
      const nomData = await nomRes.json();
      if (nomData && (nomData.display_name || nomData.address)) {
        const a = nomData.address || {};
        const road = a.road || a.pedestrian || a.footway || a.suburb || '';
        const houseNum = a.house_number || '';
        const neighborhood = a.neighbourhood || a.suburb || a.city_district || '';
        const city = a.city || a.town || a.county || '';

        const parts = [road, houseNum, neighborhood, city].filter(Boolean);
        const resolvedAddress = parts.length > 0 ? parts.join(', ') : nomData.display_name;

        return NextResponse.json({
          success: true,
          address: resolvedAddress,
          source: 'osm',
        });
      }
    } catch (osmErr) {
      console.warn('Aviso: Error en fallback Nominatim:', osmErr);
    }

    return NextResponse.json({
      success: false,
      error: 'No se pudo obtener la dirección por coordenadas geográficas.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error en el servicio de geocodificación' },
      { status: 500 }
    );
  }
}
