import { Injectable, Logger } from '@nestjs/common';
import { RouteDistance } from '../routing/routing.service';

export interface Origin {
  latitude: number;
  longitude: number;
  label: string;
}

export interface MarketInput {
  marketId: number;
  marketName: string;
  marketNameOm: string;
  city: string;
  latitude: number;
  longitude: number;
  pricePerKg: number | null;
  grade: string | null;
  priceDate: Date | null;
}

export interface TransportRateInput {
  ratePerKmPerTon: number;
  distanceKm: number;
  quantityKg: number;
}

export interface EngineInput {
  origin: Origin;
  markets: MarketInput[];
  quantityKg: number;
  transportRatePerKmPerTon: number;
  fixedRouteFees?: Record<number, number>;
}

export interface EngineOutput {
  option: {
    marketId: number;
    marketName: string;
    marketNameOm: string;
    city: string;
    latitude: number;
    longitude: number;
    pricePerKg: number | null;
    grade: string | null;
    priceDate: Date | null;
    grossRevenue: number | null;
    distanceKm: number | null;
    distanceMethod: 'mapbox' | 'haversine';
    transportCost: number | null;
    transitFees: number;
    netRevenue: number | null;
  };
  ranking: number;
  reason: string;
}

/**
 * The "Where Should I Sell?" ranking engine.
 *
 * Pure function so it is easy to unit test. Computes net revenue for every
 * market with a recent price and ranks by net revenue (NOT raw price).
 */
@Injectable()
export class RecommendationEngine {
  private readonly logger = new Logger(RecommendationEngine.name);

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

  estimateTransportCost(ratePerKmPerTon: number, distanceKm: number, quantityKg: number): number {
    if (distanceKm <= 0 || quantityKg <= 0) return 0;
    const tons = quantityKg / 1000;
    return distanceKm * ratePerKmPerTon * tons;
  }

  rank(input: EngineInput, routeDistances?: Record<number, RouteDistance>): EngineOutput[] {
    const results: EngineOutput[] = [];

    for (const market of input.markets) {
      // A market without a recent price is not eligible for ranking.
      if (!market.pricePerKg || market.pricePerKg <= 0) continue;

      const grossRevenue = market.pricePerKg * input.quantityKg;
      const routed = routeDistances?.[market.marketId];
      const distanceKilometres = routed
        ? routed.distanceKm
        : this.haversineKm(
            input.origin.latitude,
            input.origin.longitude,
            market.latitude,
            market.longitude,
          );
      const distanceMethod = routed?.method ?? 'haversine';

      let transportCost: number;
      if (input.transportRatePerKmPerTon > 0) {
        transportCost = this.estimateTransportCost(
          input.transportRatePerKmPerTon,
          distanceKilometres,
          input.quantityKg,
        );
      } else {
        transportCost = null;
      }

      const transitFees = input.fixedRouteFees?.[market.marketId] ?? 0;

      const netRevenue =
        transportCost === null
          ? null
          : grossRevenue - transportCost - transitFees;

      results.push({
        option: {
          marketId: market.marketId,
          marketName: market.marketName,
          marketNameOm: market.marketNameOm,
          city: market.city,
          latitude: market.latitude,
          longitude: market.longitude,
          pricePerKg: market.pricePerKg,
          grade: market.grade,
          priceDate: market.priceDate,
          grossRevenue,
          distanceKm: distanceKilometres,
          distanceMethod,
          transportCost,
          transitFees,
          netRevenue,
        },
        ranking: 0,
        reason: '',
      });
    }

    // Markets without transport estimates are still listed but ranked lower,
    // since we cannot confidently compare them.
    results.sort((a, b) => {
      const aNet = a.option.netRevenue;
      const bNet = b.option.netRevenue;
      if (aNet === null && bNet === null) return 0;
      if (aNet === null) return 1;
      if (bNet === null) return -1;
      return bNet - aNet;
    });

    results.forEach((r, i) => {
      r.ranking = i + 1;
      r.reason = this.buildReason(r);
    });

    return results;
  }

  private buildReason(r: EngineOutput): string {
    const { netRevenue, grossRevenue, transportCost, transitFees, marketName, distanceKm, pricePerKg } = r.option;
    if (netRevenue !== null && grossRevenue !== null && transportCost !== null) {
      const savings = netRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 });
      return `${marketName} gives you an estimated ${savings} ETB after transport costs (gross ${Math.round(grossRevenue).toLocaleString()} ETB, transport ${Math.round(transportCost).toLocaleString()} ETB, fees ${Math.round(transitFees).toLocaleString()} ETB).`;
    }
    return `${marketName} is ${distanceKm !== null ? Math.round(distanceKm) + ' km' : 'at an unknown distance'} away at ${pricePerKg} ETB/kg, but we could not fully estimate costs.`;
  }
}