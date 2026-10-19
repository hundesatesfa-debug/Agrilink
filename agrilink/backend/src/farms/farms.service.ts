import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFarmDto, UpdateFarmDto, AddFarmCropDto } from './dto/farm.dto';

@Injectable()
export class FarmsService {
  constructor(private prisma: PrismaService) {}

  private async getProfile(userId: number) {
    const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new ForbiddenException('Only farmers can manage farms');
    }
    return profile;
  }

  private async ensureOwnership(farmId: number, farmerId: number) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }
    if (farm.farmerId !== farmerId) {
      throw new ForbiddenException('You do not own this farm');
    }
    return farm;
  }

  async listFarms(userId: number) {
    const profile = await this.getProfile(userId);
    return this.prisma.farm.findMany({
      where: { farmerId: profile.id },
      include: { crops: { include: { crop: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFarm(userId: number, farmId: number) {
    const profile = await this.getProfile(userId);
    const farm = await this.ensureOwnership(farmId, profile.id);
    return this.prisma.farm.findUnique({
      where: { id: farm.id },
      include: { crops: { include: { crop: true } } },
    });
  }

  async createFarm(userId: number, dto: CreateFarmDto) {
    const profile = await this.getProfile(userId);
    return this.prisma.farm.create({
      data: {
        farmerId: profile.id,
        name: dto.name,
        latitude: dto.latitude,
        longitude: dto.longitude,
        landSize: dto.landSize,
        woreda: dto.woreda,
        kebele: dto.kebele,
      },
    });
  }

  async updateFarm(userId: number, farmId: number, dto: UpdateFarmDto) {
    const profile = await this.getProfile(userId);
    const farm = await this.ensureOwnership(farmId, profile.id);
    return this.prisma.farm.update({
      where: { id: farm.id },
      data: {
        name: dto.name ?? undefined,
        latitude: dto.latitude ?? undefined,
        longitude: dto.longitude ?? undefined,
        landSize: dto.landSize ?? undefined,
        woreda: dto.woreda ?? undefined,
        kebele: dto.kebele ?? undefined,
      },
    });
  }

  async deleteFarm(userId: number, farmId: number) {
    const profile = await this.getProfile(userId);
    const farm = await this.ensureOwnership(farmId, profile.id);
    await this.prisma.farmCrop.deleteMany({ where: { farmId: farm.id } });
    await this.prisma.farm.delete({ where: { id: farm.id } });
    return { success: true };
  }

  async addCrop(userId: number, farmId: number, dto: AddFarmCropDto) {
    const profile = await this.getProfile(userId);
    await this.ensureOwnership(farmId, profile.id);
    const crop = await this.prisma.crop.findUnique({ where: { id: dto.cropId } });
    if (!crop) {
      throw new NotFoundException('Crop not found');
    }
    return this.prisma.farmCrop.create({
      data: {
        farmId,
        cropId: dto.cropId,
        area: dto.area,
        expectedYield: dto.expectedYield,
        harvestStart: dto.harvestStart ? new Date(dto.harvestStart) : undefined,
        harvestEnd: dto.harvestEnd ? new Date(dto.harvestEnd) : undefined,
      },
      include: { crop: true },
    });
  }

  async removeCrop(userId: number, farmId: number, farmCropId: number) {
    const profile = await this.getProfile(userId);
    await this.ensureOwnership(farmId, profile.id);
    const fc = await this.prisma.farmCrop.findUnique({ where: { id: farmCropId } });
    if (!fc || fc.farmId !== farmId) {
      throw new NotFoundException('Farm crop not found');
    }
    await this.prisma.farmCrop.delete({ where: { id: farmCropId } });
    return { success: true };
  }
}
