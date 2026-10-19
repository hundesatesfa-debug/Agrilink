import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionStatusDto } from './dto/transaction.dto';
import { Role, TransactionStatus } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, role: Role, dto: CreateTransactionDto) {
    let farmerId: number | undefined;
    let buyerId: number | undefined;

    if (role === Role.FARMER) {
      const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
      if (!profile) throw new ForbiddenException('Farmer profile not found.');
      farmerId = profile.id;
    } else if (role === Role.BUYER) {
      const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
      if (!profile) throw new ForbiddenException('Buyer profile not found.');
      buyerId = profile.id;
    }

    const crop = await this.prisma.crop.findUnique({ where: { id: dto.cropId } });
    if (!crop) throw new NotFoundException('Crop not found.');

    const grossValue = dto.agreedPrice * dto.quantity;
    const transportCost = dto.transportCost ?? 0;
    const otherFees = dto.otherFees ?? 0;
    const netValue = grossValue - transportCost - otherFees;

    const tx = await this.prisma.transaction.create({
      data: {
        farmerId,
        buyerId,
        marketId: dto.marketId,
        cropId: dto.cropId,
        quantity: dto.quantity,
        unit: dto.unit || 'kg',
        agreedPrice: dto.agreedPrice,
        grossValue: Math.round(grossValue),
        transportCost: transportCost ? Math.round(transportCost) : undefined,
        otherFees,
        netValue: Math.round(netValue),
        shipmentId: dto.shipmentId,
        status: TransactionStatus.AGREED,
      },
      include: { crop: true, farmer: true, buyer: true },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'TRANSACTION',
        title: 'Transaction recorded',
        titleOm: 'Gurgurtaa galmeeffame',
        body: `Transaction for ${crop.name} worth ${Math.round(netValue).toLocaleString()} ETB was recorded.`,
        bodyOm: `Gurgurtaan ${crop.nameOm} gatii ${Math.round(netValue).toLocaleString()} ETB galmeeffameera.`,
      },
    });
    return tx;
  }

  async listMine(userId: number, role: Role) {
    const where: any = {};
    if (role === Role.FARMER) {
      const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
      if (profile) where.farmerId = profile.id;
    } else if (role === Role.BUYER) {
      const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
      if (profile) where.buyerId = profile.id;
    } else if (role === Role.TRANSPORTER) {
      const profile = await this.prisma.transporterProfile.findUnique({ where: { userId } });
      if (!profile) return [];
      const requestIds = await this.prisma.transportRequest.findMany({
        where: { transporterId: profile.id },
        select: { id: true },
      });
      if (requestIds.length === 0) return [];
      const shipments = await this.prisma.shipment.findMany({
        where: { transportRequestId: { in: requestIds.map((r) => r.id) } },
        select: { id: true },
      });
      if (shipments.length === 0) return [];
      where.shipmentId = { in: shipments.map((s) => s.id) };
    }
    return this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { crop: true, farmer: true, buyer: true, market: true },
      take: 100,
    });
  }

  async updateStatus(userId: number, role: Role, txId: number, dto: UpdateTransactionStatusDto) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: txId } });
    if (!tx) throw new NotFoundException('Transaction not found.');

    const profile =
      role === Role.FARMER
        ? await this.prisma.farmerProfile.findUnique({ where: { userId } })
        : role === Role.BUYER
          ? await this.prisma.buyerProfile.findUnique({ where: { userId } })
          : null;
    const isOwner =
      (role === Role.FARMER && profile && tx.farmerId === profile.id) ||
      (role === Role.BUYER && profile && tx.buyerId === profile.id) ||
      role === Role.ADMIN;

    if (!isOwner) throw new ForbiddenException('You do not have access to this transaction.');

    const status = dto.status as TransactionStatus;
    return this.prisma.transaction.update({
      where: { id: txId },
      data: {
        status,
        completedAt: status === TransactionStatus.COMPLETED ? new Date() : undefined,
      },
      include: { crop: true },
    });
  }

  async listAll(params: { page?: number; limit?: number; status?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where = params.status ? { status: params.status as TransactionStatus } : {};
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { crop: true, farmer: true, buyer: true, market: true },
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, total, page, limit };
  }
}