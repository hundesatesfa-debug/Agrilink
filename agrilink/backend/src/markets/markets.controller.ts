import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { Public } from '../auth/public.decorator';

@Controller('markets')
export class MarketsController {
  constructor(private marketsService: MarketsService) {}

  @Public()
  @Get()
  list() {
    return this.marketsService.listActive();
  }

  @Public()
  @Get('all')
  listAll() {
    return this.marketsService.listAll();
  }

  @Public()
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.marketsService.getById(id);
  }
}