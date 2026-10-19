import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CropsService {
  constructor(private prisma: PrismaService) {}

  async listActive() {
    return this.prisma.crop.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async listAll() {
    return this.prisma.crop.findMany({ orderBy: { name: 'asc' } });
  }

  async create(data: { name: string; nameOm: string; category?: string }) {
    return this.prisma.crop.create({ data });
  }

  async update(id: number, data: { name?: string; nameOm?: string; category?: string; active?: boolean }) {
    return this.prisma.crop.update({ where: { id }, data });
  }
}
