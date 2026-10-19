import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { PricesService } from './prices.service';
import { Public } from '../auth/public.decorator';

@Controller('prices')
export class PricesController {
  constructor(private pricesService: PricesService) {}

  @Public()
  @Get()
  list(
    @Query('cropId') cropId?: string,
    @Query('marketId') marketId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pricesService.listPublic({
      cropId: cropId ? Number(cropId) : undefined,
      marketId: marketId ? Number(marketId) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Public()
  @Get('history/:cropId')
  history(
    @Param('cropId', ParseIntPipe) cropId: number,
    @Query('marketId') marketId?: string,
    @Query('days') days?: string,
  ) {
    return this.pricesService.getCropHistory(cropId, marketId ? Number(marketId) : undefined, days ? Number(days) : undefined);
  }

  @Public()
  @Get('trend/:cropId')
  trend(
    @Param('cropId', ParseIntPipe) cropId: number,
    @Query('marketId') marketId?: string,
    @Query('days') days?: string,
  ) {
    return this.pricesService.getCropTrend(cropId, marketId ? Number(marketId) : undefined, days ? Number(days) : undefined);
  }

  @Public()
  @Get('freshness')
  freshness(@Query('cropId') cropId?: string, @Query('marketId') marketId?: string) {
    return this.pricesService.freshness(
      cropId ? Number(cropId) : undefined,
      marketId ? Number(marketId) : undefined,
    );
  }
}