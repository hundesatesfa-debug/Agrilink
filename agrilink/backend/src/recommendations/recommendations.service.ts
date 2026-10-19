import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RecommendationEngine } from './recommendation.engine';
import { RoutingService } from '../routing/routing.service';
import { WhereToSellDto, RecommendationResult, MarketOption } from './dto/where-to-sell.dto';
import { PriceVerificationStatus } from '@prisma/client';

@Injectable()
export class RecommendationsService {
  constructor(
    private prisma: PrismaService,
    private engine: RecommendationEngine,
    private routing: RoutingService,
  ) {}

  async whereToSell(userId: number | null, dto: WhereToSellDto): Promise<RecommendationResult> {
    if (!dto.quantity || dto.quantity <= 0) {
      throw new BadRequestException('Please enter a valid quantity.');
    }

    const crop = await this.prisma.crop.findUnique({ where: { id: dto.cropId } });
    if (!crop) {
      throw new NotFoundException('Crop not found.');
    }

    // Resolve origin location: explicit coords > farm > farmer profile.
    let origin: { latitude: number; longitude: number; label: string };

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      origin = {
        latitude: dto.latitude,
        longitude: dto.longitude,
        label: 'Provided location',
      };
    } else if (dto.farmId && userId) {
      const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
      if (!profile) throw new NotFoundException('Farmer profile not found.');
      const farm = await this.prisma.farm.findUnique({ where: { id: dto.farmId } });
      if (!farm) throw new NotFoundException('Farm not found.');
      if (farm.farmerId !== profile.id) throw new NotFoundException('Farm not found.');
      origin = {
        latitude: farm.latitude,
        longitude: farm.longitude,
        label: farm.name,
      };
    } else {
      const profile = userId
        ? await this.prisma.farmerProfile.findUnique({ where: { userId } })
        : null;
      if (profile && profile.latitude !== null && profile.longitude !== null) {
        origin = {
          latitude: profile.latitude,
          longitude: profile.longitude,
          label: profile.location || 'Your location',
        };
      } else {
        throw new BadRequestException(
          'We need your farm location to calculate the best market.',
        );
      }
    }

    // Active markets with a recent price for this crop.
    const prices = await this.prisma.priceObservation.findMany({
      where: {
        cropId: dto.cropId,
        verificationStatus: { in: [PriceVerificationStatus.VERIFIED, PriceVerificationStatus.PENDING] },
        market: { active: true },
      },
      include: { market: true },
      orderBy: { observationDate: 'desc' },
    });

    if (prices.length === 0) {
      throw new NotFoundException(
        'No recent price is available for this crop. Please check back later.',
      );
    }

    // Latest price per market.
    const latestByMarket = new Map<number, (typeof prices)[number]>();
    for (const p of prices) {
      if (!latestByMarket.has(p.marketId)) {
        latestByMarket.set(p.marketId, p);
      }
    }

    const marketsInput = Array.from(latestByMarket.values()).map((p) => ({
      marketId: p.marketId,
      marketName: p.market.name,
      marketNameOm: p.market.nameOm,
      city: p.market.city,
      latitude: p.market.latitude,
      longitude: p.market.longitude,
      pricePerKg: p.pricePerKg,
      grade: p.grade,
      priceDate: p.observationDate,
    }));

    const marketIds = marketsInput.map((m) => m.marketId);

    // Current transport rate (defaults shown in seed; pick most recent).
    const rates = await this.prisma.transportRate.findMany({
      orderBy: { effectiveDate: 'desc' },
    });
    const defaultRate = rates[0]
      ? rates[0].ratePerKmPerTon
      : this.DEFAULT_TRANSPORT_RATE;

    // Route fees between origin and destination markets.
    const feeRows = await this.prisma.routeFee.findMany({
      where: {
        destMarketId: { in: marketIds },
      },
    });
    const fixedRouteFees: Record<number, number> = {};
    for (const f of feeRows) {
      if (!fixedRouteFees[f.destMarketId]) fixedRouteFees[f.destMarketId] = 0;
      fixedRouteFees[f.destMarketId] += f.fee;
    }

    // Real road (or road-factor adjusted) distances between origin and markets.
    const routeDistances: Record<number, { distanceKm: number; method: 'mapbox' | 'haversine' }> = {};
    await Promise.all(
      marketsInput.map(async (m) => {
        const route = await this.routing.distanceKm(
          origin.latitude,
          origin.longitude,
          m.latitude,
          m.longitude,
        );
        routeDistances[m.marketId] = route;
      }),
    );

    const ranked = this.engine.rank(
      {
        origin,
        markets: marketsInput,
        quantityKg: dto.quantity,
        transportRatePerKmPerTon: defaultRate,
        fixedRouteFees,
      },
      routeDistances,
    );

    if (ranked.length === 0) {
      throw new NotFoundException(
        'No eligible markets found for this crop.',
      );
    }

    const options: MarketOption[] = ranked.map((r) => {
      const o: MarketOption = {
        marketId: r.option.marketId,
        marketName: r.option.marketName,
        marketNameOm: r.option.marketNameOm,
        city: r.option.city,
        latitude: r.option.latitude,
        longitude: r.option.longitude,
        pricePerKg: r.option.pricePerKg,
        grade: r.option.grade,
        priceDate: r.option.priceDate,
        grossRevenue: r.option.grossRevenue !== null ? Math.round(r.option.grossRevenue) : null,
        distanceKm: r.option.distanceKm !== null ? Math.round(r.option.distanceKm) : null,
        distanceMethod: r.option.distanceMethod,
        transportCost: r.option.transportCost !== null ? Math.round(r.option.transportCost) : null,
        transitFees: Math.round(r.option.transitFees),
        netRevenue: r.option.netRevenue !== null ? Math.round(r.option.netRevenue) : null,
        reason: r.reason,
      };
      return o;
    });

    const rankedWithRevenue = ranked.filter((r) => r.option.netRevenue !== null);
    const recommended = rankedWithRevenue.length > 0 ? options.find((o) => o.marketId === rankedWithRevenue[0].option.marketId) : options[0];

    return {
      recommended: recommended || null,
      alternatives: options.filter((o) => o.marketId !== recommended?.marketId).slice(0, 5),
      cropName: crop.name,
      cropNameOm: crop.nameOm,
      quantity: dto.quantity,
      origin: { ...origin, label: origin.label },
      calculationNote: this.routing.source === 'mapbox'
        ? 'Net revenue = (price per kg x quantity) - transport cost - route fees. Distance uses Mapbox road routing.'
        : 'Net revenue = (price per kg x quantity) - transport cost - route fees. Transport cost is estimated using road-adjusted distance from your farm to the market.',
    };
  }

  private readonly DEFAULT_TRANSPORT_RATE = 8; // ETB per km per ton (seed default)
}