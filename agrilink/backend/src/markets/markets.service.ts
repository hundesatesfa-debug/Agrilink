import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateMarketDto, UpdateMarketDto } from './dto/market.dto';

@Injectable()
export class MarketsService {
  constructor(private prisma: PrismaService) {}

  async listActive() {
    return this.prisma.market.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        priceObservations: {
          where: { verificationStatus: { in: ['VERIFIED', 'PENDING'] } },
          orderBy: { observationDate: 'desc' },
          take: 1,
          include: { crop: true },
        },
      },
    });
  }

  async listAll() {
    return this.prisma.market.findMany({ orderBy: { name: 'asc' } });
  }

  async getById(id: number) {
    return this.prisma.market.findUnique({
      where: { id },
      include: {
        priceObservations: {
          orderBy: { observationDate: 'desc' },
          take: 20,
          include: { crop: true },
        },
      },
    });
  }

  async create(dto: CreateMarketDto) {
    return this.prisma.market.create({
      data: {
        name: dto.name,
        nameOm: dto.nameOm,
        city: dto.city,
        woreda: dto.woreda,
        latitude: dto.latitude,
        longitude: dto.longitude,
        type: dto.type,
      },
    });
  }

  async update(id: number, dto: UpdateMarketDto) {
    return this.prisma.market.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        nameOm: dto.nameOm ?? undefined,
        city: dto.city ?? undefined,
        woreda: dto.woreda ?? undefined,
        latitude: dto.latitude ?? undefined,
        longitude: dto.longitude ?? undefined,
        type: dto.type ?? undefined,
        active: dto.active ?? undefined,
      },
    });
  }
}