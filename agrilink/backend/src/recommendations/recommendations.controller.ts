import { Controller, Post, Body } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { WhereToSellDto } from './dto/where-to-sell.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Post('where-to-sell')
  whereToSell(@Body() dto: WhereToSellDto, @CurrentUser('id') userId?: number) {
    return this.recommendationsService.whereToSell(userId ?? null, dto);
  }
}