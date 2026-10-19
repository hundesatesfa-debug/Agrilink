import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationEngine } from './recommendation.engine';
import { RoutingModule } from '../routing/routing.module';

@Module({
  imports: [RoutingModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, RecommendationEngine],
  exports: [RecommendationsService, RecommendationEngine],
})
export class RecommendationsModule {}