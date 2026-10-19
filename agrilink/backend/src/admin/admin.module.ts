import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PricesModule } from '../prices/prices.module';
import { MarketsModule } from '../markets/markets.module';
import { CropsModule } from '../crops/crops.module';
import { BuyersModule } from '../buyers/buyers.module';

@Module({
  imports: [PricesModule, MarketsModule, CropsModule, BuyersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}