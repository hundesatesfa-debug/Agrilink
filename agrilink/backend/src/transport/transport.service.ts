import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RoutingService } from '../routing/routing.service';
import {
  CreateVehicleDto,
  CreateTransportRequestDto,
  UpdateShipmentStatusDto,
  UpdateTransporterDto,
} from './dto/transport.dto';
import { Role, TransportRequestStatus, ShipmentStatus } from '@prisma/client';

@Injectable()
export class TransportService {
  constructor(
    private prisma: PrismaService,
    private routing: RoutingService,
  ) {}

  // Transporter profile
  async getTransporterByUserId(userId: number) {
    return this.prisma.transporterProfile.findUnique({
      where: { userId },
      include: { vehicles: true },
    });
  }

  async updateTransporter(userId: number, dto: UpdateTransporterDto) {
    const profile = await this.prisma.transporterProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Transporter profile not found.');
    return this.prisma.transporterProfile.update({
      where: { id: profile.id },
      data: {
        name: dto.name ?? undefined,
        serviceArea: dto.serviceArea ?? undefined,
        latitude: dto.latitude ?? undefined,
        longitude: dto.longitude ?? undefined,
        available: dto.available ?? undefined,
      },
    });
  }

  async addVehicle(userId: number, dto: CreateVehicleDto) {
    const profile = await this.prisma.transporterProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Transporter profile not found.');
    if (profile.userId !== userId) throw new ForbiddenException('Not authorized.');
    return this.prisma.vehicle.create({
      data: {
        transporterId: profile.id,
        type: dto.type,
        plateNumber: dto.plateNumber,
        capacityKg: dto.capacityKg,
      },
    });
  }

  async listPublicTransporters() {
    return this.prisma.transporterProfile.findMany({
      where: { available: true },
      include: { vehicles: true },
      orderBy: { name: 'asc' },
    });
  }

  // Transport requests
  async createTransportRequest(userId: number, role: Role, dto: CreateTransportRequestDto) {
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

    const route = await this.routing.distanceKm(
      dto.pickupLat, dto.pickupLng, dto.destLat, dto.destLng,
    );
    const distanceKm = route.distanceKm;
    const rates = await this.prisma.transportRate.findMany({
      orderBy: { effectiveDate: 'desc' },
      take: 1,
    });
    const rate = rates[0]?.ratePerKmPerTon || 8;
    const estimatedPrice = distanceKm * rate * (dto.quantity / 1000);

    return this.prisma.transportRequest.create({
      data: {
        farmerId,
        buyerId,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        pickupLabel: dto.pickupLabel,
        destLat: dto.destLat,
        destLng: dto.destLng,
        destLabel: dto.destLabel,
        cropId: dto.cropId,
        quantity: dto.quantity,
        unit: dto.unit || 'kg',
        preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : undefined,
        vehicleType: dto.vehicleType,
        estimatedPrice: Math.round(estimatedPrice),
        distanceKm: Math.round(distanceKm),
        status: TransportRequestStatus.REQUESTED,
        shipment: {
          create: {
            status: ShipmentStatus.REQUESTED,
            trackingRef: this.generateTrackingRef(),
          },
        },
      },
      include: { shipment: true, crop: true },
    });
  }

  async listPublicRequests() {
    return this.prisma.transportRequest.findMany({
      where: { status: { in: [TransportRequestStatus.REQUESTED, TransportRequestStatus.MATCHED] } },
      orderBy: { createdAt: 'desc' },
      include: { farmer: true, crop: true, shipment: true },
    });
  }

  async listMyRequests(userId: number, role: Role) {
    const where: any = {};
    if (role === Role.FARMER) {
      const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
      if (profile) where.farmerId = profile.id;
    } else if (role === Role.BUYER) {
      const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
      if (profile) where.buyerId = profile.id;
    } else if (role === Role.TRANSPORTER) {
      const profile = await this.prisma.transporterProfile.findUnique({ where: { userId } });
      if (profile) where.transporterId = profile.id;
    }
    return this.prisma.transportRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { farmer: true, crop: true, shipment: true },
    });
  }

  async matchTransporter(requestId: number, transporterId: number) {
    const request = await this.prisma.transportRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Transport request not found.');
    return this.prisma.transportRequest.update({
      where: { id: requestId },
      data: { transporterId, status: TransportRequestStatus.MATCHED },
      include: { shipment: true },
    });
  }

  async respondToRequest(userId: number, requestId: number, accept: boolean) {
    const profile = await this.prisma.transporterProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Only transporters can accept requests.');
    const request = await this.prisma.transportRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Transport request not found.');
    return this.prisma.transportRequest.update({
      where: { id: requestId },
      data: {
        transporterId: profile.id,
        status: accept
          ? TransportRequestStatus.ACCEPTED
          : TransportRequestStatus.REJECTED,
      },
      include: { shipment: true },
    });
  }

  async updateShipmentStatus(shipmentId: number, dto: UpdateShipmentStatusDto) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException('Shipment not found.');
    return this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: dto.status,
        currentLat: dto.currentLat ?? undefined,
        currentLng: dto.currentLng ?? undefined,
        deliveredAt: dto.status === ShipmentStatus.DELIVERED ? new Date() : undefined,
      },
      include: { transportRequest: { include: { crop: true } } },
    });
  }

  private generateTrackingRef() {
    return 'AG' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
}