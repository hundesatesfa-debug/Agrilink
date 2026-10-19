import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { DemandStatus } from '@prisma/client';
import { Public } from '../auth/public.decorator';

@Controller('buyers')
export class BuyersController {
  constructor(private buyersService: BuyersService) {}

  @Public()
  @Get()
  list() {
    return this.buyersService.listBuyers();
  }

  @Public()
  @Get('demands')
  listDemands(
    @Query('cropId') cropId?: string,
    @Query('status') status?: string,
  ) {
    return this.buyersService.listPublic({
      cropId: cropId ? Number(cropId) : undefined,
      status: (status as DemandStatus) || undefined,
    });
  }

  @Public()
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.buyersService.getBuyerProfile(id);
  }

  @Public()
  @Get(':id/reliability')
  reliability(@Param('id', ParseIntPipe) id: number) {
    return this.buyersService.calculateReliability(id);
  }
}