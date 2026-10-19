import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const today = new Date();
    const cutoff7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [
      farmers,
      buyers,
      transporters,
      activeMarkets,
      activeDemands,
      crops,
      transactions,
      totalVolume,
      avgPrice,
      freshPriceCount,
      stalePriceCount,
      totalPrices,
      priceFresh7,
      transportRequests,
      shipmentsInTransit,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'FARMER' } }),
      this.prisma.user.count({ where: { role: 'BUYER' } }),
      this.prisma.user.count({ where: { role: 'TRANSPORTER' } }),
      this.prisma.market.count({ where: { active: true } }),
      this.prisma.buyerDemand.count({ where: { status: 'OPEN' } }),
      this.prisma.crop.count({ where: { active: true } }),
      this.prisma.transaction.count(),
      this.prisma.transaction.aggregate({ _sum: { quantity: true } }),
      this.prisma.priceObservation.aggregate({ _avg: { pricePerKg: true } }),
      this.prisma.priceObservation.count({ where: { verificationStatus: 'VERIFIED' } }),
      this.prisma.priceObservation.count({ where: { verificationStatus: { in: ['PENDING', 'EXPIRED'] } } }),
      this.prisma.priceObservation.count(),
      this.prisma.priceObservation.count({ where: { observationDate: { gte: cutoff7 } } }),
      this.prisma.transportRequest.count(),
      this.prisma.shipment.count({ where: { status: 'IN_TRANSIT' } }),
    ]);

    const freshnessPercent = totalPrices > 0 ? Math.round((priceFresh7 / totalPrices) * 1000) / 10 : 0;

    return {
      counts: {
        farmers,
        buyers,
        transporters,
        activeMarkets,
        activeDemands,
        crops,
        completedTransactions: transactions,
        totalCropVolume: totalVolume._sum.quantity || 0,
        avgPricePerKg: Math.round((avgPrice._avg.pricePerKg || 0) * 100) / 100,
        verifiedPrices: freshPriceCount,
        unverifiedPrices: stalePriceCount,
        transportRequests,
        shipmentsInTransit,
      },
      priceFreshness: {
        total: totalPrices,
        freshWithin7Days: priceFresh7,
        stale: totalPrices - priceFresh7,
        freshnessPercent,
      },
    };
  }

  async listUsers(params: { role?: string; status?: string }) {
    return this.prisma.user.findMany({
      where: {
        ...(params.role ? { role: params.role as any } : {}),
        ...(params.status ? { status: params.status as any } : {}),
      },
      include: {
        farmerProfile: true,
        buyerProfile: true,
        transporterProfile: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async updateUserStatus(userId: number, status: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
      select: { id: true, phone: true, role: true, status: true },
    });
  }

  async verifyBuyer(buyerProfileId: number, status: string) {
    return this.prisma.buyerProfile.update({
      where: { id: buyerProfileId },
      data: { verificationStatus: status as any },
      select: { id: true, businessName: true, verificationStatus: true },
    });
  }
}