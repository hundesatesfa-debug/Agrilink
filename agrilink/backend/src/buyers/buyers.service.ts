import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateBuyerProfileDto, CreateDemandDto, UpdateDemandDto } from './dto/buyer.dto';
import { DemandStatus } from '@prisma/client';

@Injectable()
export class BuyersService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: number) {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      include: { demands: { include: { crop: true }, orderBy: { createdAt: 'desc' } } },
    });
    if (!profile) {
      throw new NotFoundException('Buyer profile not found.');
    }
    return profile;
  }

  async updateMyProfile(userId: number, dto: UpdateBuyerProfileDto) {
    const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Buyer profile not found.');
    return this.prisma.buyerProfile.update({
      where: { id: profile.id },
      data: {
        businessName: dto.businessName ?? undefined,
        contactPerson: dto.contactPerson ?? undefined,
        location: dto.location ?? undefined,
        latitude: dto.latitude ?? undefined,
        longitude: dto.longitude ?? undefined,
        serviceArea: dto.serviceArea ?? undefined,
        isCollector: dto.isCollector ?? undefined,
        fee: dto.fee ?? undefined,
        status: dto.status ?? undefined,
      },
    });
  }

  // Public marketplace listing
  async listPublic(params: { cropId?: number; status?: DemandStatus }) {
    return this.prisma.buyerDemand.findMany({
      where: {
        status: params.status || DemandStatus.OPEN,
        ...(params.cropId ? { cropId: Number(params.cropId) } : {}),
        buyer: { status: { in: ['BUYING_NOW', 'ACTIVE'] } },
      },
      orderBy: { postedAt: 'desc' },
      include: {
        buyer: {
          select: {
            id: true,
            businessName: true,
            isCollector: true,
            verificationStatus: true,
            location: true,
            serviceArea: true,
            fee: true,
            _count: { select: { transactions: true } },
          },
        },
        crop: true,
      },
    });
  }

  async listBuyers() {
    return this.prisma.buyerProfile.findMany({
      where: { status: { in: ['BUYING_NOW', 'ACTIVE'] } },
      orderBy: { businessName: 'asc' },
      include: {
        _count: { select: { transactions: true, reviews: true } },
      },
    });
  }

  async getBuyerProfile(id: number) {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { id },
      include: {
        _count: { select: { transactions: true } },
        reviews: true,
        demands: {
          where: { status: DemandStatus.OPEN },
          include: { crop: true },
          take: 10,
        },
      },
    });
    if (!profile) throw new NotFoundException('Buyer not found.');
    return profile;
  }

  // Demand CRUD
  async createDemand(userId: number, dto: CreateDemandDto) {
    const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Only buyers can post demand.');
    const crop = await this.prisma.crop.findUnique({ where: { id: dto.cropId } });
    if (!crop) throw new BadRequestException('Crop not found.');
    return this.prisma.buyerDemand.create({
      data: {
        buyerId: profile.id,
        cropId: dto.cropId,
        farmerId: dto.farmerId,
        grade: dto.grade,
        quantity: dto.quantity,
        unit: dto.unit || 'kg',
        offeredPrice: dto.offeredPrice,
        location: dto.location,
        status: dto.status || DemandStatus.OPEN,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: { crop: true },
    });
  }

  async listMyDemands(userId: number) {
    const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Only buyers can manage demand.');
    return this.prisma.buyerDemand.findMany({
      where: { buyerId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: { crop: true, farmer: true },
    });
  }

  async updateDemand(userId: number, demandId: number, dto: UpdateDemandDto) {
    const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    const demand = await this.prisma.buyerDemand.findUnique({ where: { id: demandId } });
    if (!demand) throw new NotFoundException('Demand not found.');
    if (demand.buyerId !== profile.id) throw new ForbiddenException('You do not own this demand.');
    return this.prisma.buyerDemand.update({
      where: { id: demandId },
      data: {
        grade: dto.grade ?? undefined,
        quantity: dto.quantity ?? undefined,
        offeredPrice: dto.offeredPrice ?? undefined,
        status: dto.status ?? undefined,
      },
      include: { crop: true },
    });
  }

  async deleteDemand(userId: number, demandId: number) {
    const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    const demand = await this.prisma.buyerDemand.findUnique({ where: { id: demandId } });
    if (!demand) throw new NotFoundException('Demand not found.');
    if (demand.buyerId !== profile.id) throw new ForbiddenException('You do not own this demand.');
    await this.prisma.buyerDemand.delete({ where: { id: demandId } });
    return { success: true };
  }

  // Reliability estimate (simple, honest for users with no history)
  async calculateReliability(buyerId: number) {
    const [total, reviews, cancelled] = await Promise.all([
      this.prisma.transaction.count({ where: { buyerId, status: 'COMPLETED' } }),
      this.prisma.review.aggregate({ where: { buyerId }, _avg: { rating: true } }),
      this.prisma.transaction.count({ where: { buyerId, status: 'CANCELLED' } }),
    ]);
    const allTransactions = await this.prisma.transaction.count({ where: { buyerId } });
    if (allTransactions === 0) {
      return {
        score: null,
        level: 'no-history',
        label: 'No transaction history yet',
        completed: 0,
        cancellationRate: null,
      };
    }
    let score = 50;
    score += Math.min(30, total * 5);
    if (reviews._avg.rating) score += (reviews._avg.rating - 3) * 10;
    score -= Math.min(30, cancelled * 8);
    const level = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
    return {
      score: Math.max(5, Math.min(99, Math.round(score))),
      level,
      label: level === 'high' ? 'Reliable' : level === 'medium' ? 'Fair' : 'Needs attention',
      completed: total,
      cancelled,
    };
  }
}