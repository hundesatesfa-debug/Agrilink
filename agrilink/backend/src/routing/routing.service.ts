import { Injectable, Logger } from '@nestjs/common';

export interface RouteDistance {
  distanceKm: number;
  method: 'mapbox' | 'haversine';
  durationSeconds?: number;
}

/**
 * Road-distance layer for the "Where Should I Sell?" engine.
 *
 * Uses the Mapbox Directions API when a MAPBOX_API_KEY is configured and
 * falls back to a great-circle (haversine) estimate scaled by a road factor
 * (default 1.35, the typical urban/rural detour ratio) otherwise. Results are
 * cached in memory so repeated origin/market pairs are not re-fetched.
 */
@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  private readonly cache = new Map<string, { at: number; value: RouteDistance }>();
  private readonly CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
  private readonly MAPBOX_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';
  private readonly mapboxKey: string | undefined = process.env.MAPBOX_API_KEY;
  private readonly roadFactor = Number(process.env.ROAD_DISTANCE_FACTOR || 1.35);

  readonly source: 'mapbox' | 'haversine' = this.mapboxKey ? 'mapbox' : 'haversine';

  readonly EARTH_RADIUS_KM = 6371;

  haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  async distanceKm(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<RouteDistance> {
    const key = `${originLat.toFixed(5)},${originLng.toFixed(5)}|${destLat.toFixed(5)},${destLng.toFixed(5)}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < this.CACHE_TTL_MS) return cached.value;

    const straight = this.haversineKm(originLat, originLng, destLat, destLng);
    const fallback: RouteDistance = {
      distanceKm: Math.round(straight * this.roadFactor),
      method: 'haversine',
    };

    let result = fallback;
    if (this.mapboxKey) {
      try {
        // Mapbox expects longitude,latitude.
        const url =
          `${this.MAPBOX_URL}/${originLng},${originLat};${destLng},${destLat}` +
          `?access_token=${this.mapboxKey}&overview=false&geometries=geojson`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const json: any = await res.json();
          const route = json?.routes?.[0];
          if (route && typeof route.distance === 'number' && route.distance > 0) {
            result = {
              distanceKm: Math.round(route.distance / 1000),
              method: 'mapbox',
              durationSeconds: route.duration,
            };
          }
        }
      } catch (err) {
        this.logger.warn(
          `Mapbox routing failed for ${key}, using haversine x ${this.roadFactor}: ${(err as Error).message}`,
        );
      }
    }

    this.cache.set(key, { at: Date.now(), value: result });
    return result;
  }
}