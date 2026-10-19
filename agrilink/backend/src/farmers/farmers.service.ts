import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateFarmerProfileDto } from './dto/update-farmer.dto';

@Injectable()
export class FarmersService {
  constructor(private prisma: PrismaService) {}

  async listProducePosts(farmerId?: number) {
    return this.prisma.farmerProducePost.findMany({
      where: {
        isActive: true,
        ...(farmerId ? { farmerId } : {}),
      },
      include: {
        crop: { select: { id: true, name: true, nameOm: true } },
        farmer: { select: { id: true, name: true, location: true, woreda: true } },
      },
      orderBy: { postedAt: 'desc' },
    });
  }

  async createProducePost(userId: number, data: {
    cropId: number;
    title: string;
    description?: string;
    quantity: number;
    unit?: string;
    pricePerUnit?: number;
    imageUrl: string;
  }) {
    const farmer = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!farmer) {
      throw new NotFoundException('Farmer profile not found');
    }

    const crop = await this.prisma.crop.findFirst({
      where: { id: data.cropId, active: true },
      select: { id: true },
    });
    if (!crop) {
      throw new NotFoundException('Crop not found');
    }

    return this.prisma.farmerProducePost.create({
      data: {
        ...data,
        farmerId: farmer.id,
      },
      include: {
        crop: { select: { id: true, name: true, nameOm: true } },
        farmer: { select: { id: true, name: true, location: true, woreda: true } },
      },
    });
  }

  async getMeProfile(userId: number) {
    const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Farmer profile not found');
    }
    return profile;
  }

  async updateMeProfile(userId: number, dto: UpdateFarmerProfileDto) {
    const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Farmer profile not found');
    }
    return this.prisma.farmerProfile.update({
      where: { id: profile.id },
      data: {
        name: dto.name ?? undefined,
        nationalId: dto.nationalId ?? undefined,
        location: dto.location ?? undefined,
        latitude: dto.latitude ?? undefined,
        longitude: dto.longitude ?? undefined,
        cooperative: dto.cooperative ?? undefined,
        woreda: dto.woreda ?? undefined,
        kebele: dto.kebele ?? undefined,
      },
    });
  }

  async getFarmerWithDashboard(userId: number) {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      include: {
        farms: { include: { crops: { include: { crop: true } } } },
      },
    });
    if (!profile) {
      throw new NotFoundException('Farmer profile not found');
    }
    return profile;
  }
}
