import { Client } from '@/types';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculates the great-circle distance between two GPS coordinates in meters
 * using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Human-readable distance formatter
 * e.g., 45 -> "a 45 m", 1250 -> "a 1.3 km"
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || isNaN(meters)) {
    return 'Distancia no disponible';
  }
  if (meters < 1000) {
    return `a ${meters} m`;
  }
  const km = (meters / 1000).toFixed(1);
  return `a ${km} km`;
}

export interface ClientWithDistance extends Client {
  distanceMeters?: number;
  distanceFormatted?: string;
}

/**
 * Sorts an array of clients by geographic proximity to a target coordinate.
 */
export function sortClientsByProximity(
  clients: Client[],
  currentLocation?: GeoCoordinates | null
): ClientWithDistance[] {
  if (!currentLocation || typeof currentLocation.latitude !== 'number' || typeof currentLocation.longitude !== 'number') {
    return clients.map((c) => ({ ...c }));
  }

  return clients
    .map((client) => {
      const distanceMeters = calculateDistanceMeters(
        currentLocation.latitude,
        currentLocation.longitude,
        client.latitude,
        client.longitude
      );

      return {
        ...client,
        distanceMeters,
        distanceFormatted: formatDistance(distanceMeters),
      };
    })
    .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
}
