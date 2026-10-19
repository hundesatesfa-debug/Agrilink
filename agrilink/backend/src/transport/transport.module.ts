import { Module } from '@nestjs/common';
import { TransportService } from './transport.service';
import { TransportersController } from './transporters.controller';
import { TransportRequestsController } from './transport-requests.controller';
import { RoutingModule } from '../routing/routing.module';

@Module({
  imports: [RoutingModule],
  controllers: [TransportersController, TransportRequestsController],
  providers: [TransportService],
  exports: [TransportService],
})
export class TransportModule {}