import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePriceDto } from './dto/price.dto';
import { PriceVerificationStatus } from '@prisma/client';

@Injectable()
export class PricesService {
  private readonly STABLE_BAND_PCT = 3; // ±3% is considered "stable"

  constructor(private prisma: PrismaService) {}

  async listPublic(params: { cropId?: number; marketId?: number; limit?: number }) {
    const where: any = {
      verificationStatus: { in: [PriceVerificationStatus.VERIFIED, PriceVerificationStatus.PENDING] },
    };
    if (params.cropId) where.cropId = Number(params.cropId);
    if (params.marketId) where.marketId = Number(params.marketId);

    const observations = await this.prisma.priceObservation.findMany({
      where,
      orderBy: [{ cropId: 'asc' }, { observationDate: 'desc' }],
      take: params.limit || 100,
      include: { crop: true, market: true },
    });

    return this.dedupeByCropMarket(observations);
  }

  private dedupeByCropMarket(rows: any[]) {
    const seen = new Set<string>();
    const result = [];
    for (const row of rows) {
      const key = `${row.cropId}-${row.marketId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(row);
    }
    return result;
  }

  async getLatestForCrop(cropId: number, marketId?: number) {
    const where: any = { cropId };
    if (marketId) where.marketId = marketId;
    return this.prisma.priceObservation.findFirst({
      where: {
        ...where,
        verificationStatus: { in: [PriceVerificationStatus.VERIFIED, PriceVerificationStatus.PENDING] },
      },
      orderBy: { observationDate: 'desc' },
    });
  }

  async getMarketPrices(marketId: number) {
    return this.listPublic({ marketId });
  }

  async getCropHistory(cropId: number, marketId?: number, days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.prisma.priceObservation.findMany({
      where: {
        cropId,
        ...(marketId ? { marketId } : {}),
        observationDate: { gte: since },
      },
      orderBy: { observationDate: 'asc' },
      include: { market: true },
    });
  }

  /**
   * Simple trend analysis: for each market, compares the average price over
   * the last 7 days against the previous 7-day window and returns a direction
   * (UP / DOWN / STABLE / INSUFFICIENT_DATA). Also returns a weekly series so
   * the frontend can plot the movement frame-by-frame.
   */
  async getCropTrend(cropId: number, marketId?: number, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.prisma.priceObservation.findMany({
      where: {
        cropId,
        ...(marketId ? { marketId } : {}),
        observationDate: { gte: since },
      },
      orderBy: { observationDate: 'asc' },
      include: { market: true },
    });

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const byMarket = new Map<number, (typeof rows)[number][]>();
    for (const row of rows) {
      if (!byMarket.has(row.marketId)) byMarket.set(row.marketId, []);
      byMarket.get(row.marketId)!.push(row);
    }

    const avg = (items: (typeof rows)[number][]) =>
      items.length === 0
        ? null
        : items.reduce((sum, i) => sum + i.pricePerKg, 0) / items.length;

    const markets = Array.from(byMarket.values()).map((items) => {
      const recent = items.filter((i) => i.observationDate >= weekAgo);
      const previous = items.filter((i) => i.observationDate < weekAgo);
      const currentPrice = avg(recent);
      const previousPrice = avg(previous);
      const changePct =
        currentPrice !== null && previousPrice
          ? ((currentPrice - previousPrice) / previousPrice) * 100
          : null;

      const direction =
        currentPrice === null || changePct === null
          ? 'INSUFFICIENT_DATA'
          : changePct > this.STABLE_BAND_PCT
            ? 'UP'
            : changePct < -this.STABLE_BAND_PCT
              ? 'DOWN'
              : 'STABLE';

      const first = items[0].market;
      const series = this.buildWeeklySeries(items, since, now);

      return {
        marketId: first.id,
        marketName: first.name,
        marketNameOm: first.nameOm,
        city: first.city,
        currentPricePerKg: currentPrice !== null ? Math.round(currentPrice * 100) / 100 : null,
        previousPricePerKg: previousPrice !== null ? Math.round(previousPrice * 100) / 100 : null,
        changePercent: changePct !== null ? Math.round(changePct * 100) / 100 : null,
        direction,
        sampleSize: items.length,
        lastObservedDate: items[items.length - 1].observationDate,
        series,
      };
    });

    const withData = markets.filter((m) => m.direction !== 'INSUFFICIENT_DATA');
    const withoutData = markets.filter((m) => m.direction === 'INSUFFICIENT_DATA');
    const overallChange =
      withData.length > 0
        ? withData.reduce((sum, m) => sum + (m.changePercent ?? 0), 0) / withData.length
        : null;
    const overallDirection =
      overallChange === null
        ? 'INSUFFICIENT_DATA'
        : overallChange > this.STABLE_BAND_PCT
          ? 'UP'
          : overallChange < -this.STABLE_BAND_PCT
            ? 'DOWN'
            : 'STABLE';

    return {
      cropId,
      marketId: marketId ?? null,
      periodDays: days,
      generatedAt: now,
      overallDirection,
      overallChangePercent:
        overallChange !== null ? Math.round(overallChange * 100) / 100 : null,
      markets: [
        ...withData.sort((a, b) => b.sampleSize - a.sampleSize),
        ...withoutData.sort((a, b) => a.marketName.localeCompare(b.marketName)),
      ],
    };
  }

  private buildWeeklySeries(
    items: any[],
    from: Date,
    to: Date,
  ): { label: string; from: Date; to: Date; avgPricePerKg: number | null; observationCount: number }[] {
    const buckets: { from: Date; to: Date; items: any[] }[] = [];
    let cursor = new Date(from);
    while (cursor < to) {
      const end = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
      buckets.push({ from: new Date(cursor), to: end < to ? end : new Date(to), items: [] });
      cursor = end;
    }
    for (const item of items) {
      const bucket = buckets.find((b) => item.observationDate >= b.from && item.observationDate < b.to);
      if (bucket) bucket.items.push(item);
    }
    return buckets
      .filter((b) => b.items.length > 0)
      .map((b) => ({
        label: b.from.toISOString().slice(0, 10),
        from: b.from,
        to: b.to,
        avgPricePerKg:
          b.items.length === 0
            ? null
            : Math.round((b.items.reduce((s, i) => s + i.pricePerKg, 0) / b.items.length) * 100) / 100,
        observationCount: b.items.length,
      }));
  }

  /**
   * Data freshness: how much of the price database is ≤ 7 days old (the KPI
   * surfaced in Section 14 of the roadmap).
   */
  async freshness(cropId?: number, marketId?: number) {
    const where: any = {};
    if (cropId) where.cropId = cropId;
    if (marketId) where.marketId = marketId;

    const today = new Date();
    const cutoff7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoff30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const cutoff90 = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [total, within7, within30, within90, newest] = await Promise.all([
      this.prisma.priceObservation.count({ where }),
      this.prisma.priceObservation.count({ where: { ...where, observationDate: { gte: cutoff7 } } }),
      this.prisma.priceObservation.count({
        where: { ...where, observationDate: { gte: cutoff30, lt: cutoff7 } },
      }),
      this.prisma.priceObservation.count({
        where: { ...where, observationDate: { gte: cutoff90, lt: cutoff30 } },
      }),
      this.prisma.priceObservation.findFirst({
        where,
        orderBy: { observationDate: 'desc' },
        select: { observationDate: true },
      }),
    ]);

    return {
      total,
      freshWithin7Days: within7,
      stale: total - within7,
      freshnessPercent: total > 0 ? Math.round((within7 / total) * 1000) / 10 : 0,
      ageBuckets: {
        '<=7d': within7,
        '8-30d': within30,
        '31-90d': within90,
        '>90d': Math.max(0, total - within7 - within30 - within90),
      },
      newestObservationDate: newest?.observationDate ?? null,
    };
  }

  async createPrice(dto: CreatePriceDto) {
    return this.prisma.priceObservation.create({
      data: {
        cropId: dto.cropId,
        marketId: dto.marketId,
        grade: dto.grade,
        pricePerKg: dto.pricePerKg,
        observationDate: dto.observationDate ? new Date(dto.observationDate) : new Date(),
        source: dto.source,
        sourceDetail: dto.sourceDetail,
        verificationStatus: PriceVerificationStatus.PENDING,
      },
      include: { crop: true, market: true },
    });
  }

  async updatePrice(id: number, data: {
    pricePerKg?: number;
    grade?: string;
    verificationStatus?: PriceVerificationStatus;
    observationDate?: string;
  }) {
    return this.prisma.priceObservation.update({
      where: { id },
      data: {
        pricePerKg: data.pricePerKg ?? undefined,
        grade: data.grade ?? undefined,
        verificationStatus: data.verificationStatus ?? undefined,
        observationDate: data.observationDate ? new Date(data.observationDate) : undefined,
      },
      include: { crop: true, market: true },
    });
  }

  async verifyPrice(id: number) {
    return this.updatePrice(id, { verificationStatus: PriceVerificationStatus.VERIFIED });
  }

  async expirePrice(id: number) {
    return this.updatePrice(id, { verificationStatus: PriceVerificationStatus.EXPIRED });
  }
}