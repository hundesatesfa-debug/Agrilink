import { Module } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { BuyersController } from './buyers.controller';
import { DemandsController } from './demands.controller';

@Module({
  controllers: [DemandsController, BuyersController],
  providers: [BuyersService],
  exports: [BuyersService],
})
export class BuyersModule {}