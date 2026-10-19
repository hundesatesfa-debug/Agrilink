import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PricesService } from '../prices/prices.service';
import { MarketsService } from '../markets/markets.service';
import { CropsService } from '../crops/crops.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, PriceVerificationStatus } from '@prisma/client';
import { CreatePriceDto } from '../prices/dto/price.dto';
import { CreateMarketDto, UpdateMarketDto } from '../markets/dto/market.dto';

@Controller('admin')
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private pricesService: PricesService,
    private marketsService: MarketsService,
    private cropsService: CropsService,
    private prisma: PrismaService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('users')
  listUsers(@Query('role') role?: string, @Query('status') status?: string) {
    return this.adminService.listUsers({ role, status });
  }

  @Put('users/:id/status')
  updateUserStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.adminService.updateUserStatus(id, status);
  }

  @Put('buyers/:id/verify')
  verifyBuyer(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.adminService.verifyBuyer(id, status);
  }

  @Post('markets')
  createMarket(@Body() dto: CreateMarketDto) {
    return this.marketsService.create(dto);
  }

  @Put('markets/:id')
  updateMarket(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMarketDto) {
    return this.marketsService.update(id, dto);
  }

  @Post('prices')
  createPrice(@Body() dto: CreatePriceDto) {
    return this.prisma.priceObservation.create({
      data: {
        cropId: dto.cropId,
        marketId: dto.marketId,
        grade: dto.grade,
        pricePerKg: dto.pricePerKg,
        observationDate: dto.observationDate ? new Date(dto.observationDate) : new Date(),
        source: dto.source,
        sourceDetail: dto.sourceDetail || 'Admin entry',
        verificationStatus: dto.source === 'SEED_DEMO' ? PriceVerificationStatus.PENDING : PriceVerificationStatus.VERIFIED,
      },
      include: { crop: true, market: true },
    });
  }

  @Get('prices')
  listPrices(@Query('cropId') cropId?: string, @Query('marketId') marketId?: string) {
    return this.prisma.priceObservation.findMany({
      where: {
        ...(cropId ? { cropId: Number(cropId) } : {}),
        ...(marketId ? { marketId: Number(marketId) } : {}),
      },
      orderBy: { observationDate: 'desc' },
      take: 300,
      include: { crop: true, market: true },
    });
  }

  @Put('prices/:id')
  updatePrice(
    @Param('id', ParseIntPipe) id: number,
    @Body('pricePerKg') pricePerKg?: number,
    @Body('verificationStatus') verificationStatus?: PriceVerificationStatus,
  ) {
    return this.pricesService.updatePrice(id, {
      pricePerKg: pricePerKg ?? undefined,
      verificationStatus: verificationStatus ?? undefined,
    });
  }

  @Post('prices/:id/verify')
  verifyPrice(@Param('id', ParseIntPipe) id: number) {
    return this.pricesService.verifyPrice(id);
  }

  @Post('prices/:id/expire')
  expirePrice(@Param('id', ParseIntPipe) id: number) {
    return this.pricesService.expirePrice(id);
  }

  @Post('crops')
  createCrop(@Body() dto: { name: string; nameOm: string; category?: string }) {
    return this.cropsService.create(dto);
  }

  @Get('transport-rates')
  listTransportRates() {
    return this.prisma.transportRate.findMany({ orderBy: { effectiveDate: 'desc' } });
  }

  @Post('transport-rates')
  createTransportRate(@Body() dto: {
    routeType?: string;
    vehicleType: string;
    ratePerKmPerTon: number;
  }) {
    return this.prisma.transportRate.create({
      data: {
        routeType: dto.routeType || 'general',
        vehicleType: dto.vehicleType,
        ratePerKmPerTon: dto.ratePerKmPerTon,
      },
    });
  }
}