import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { TransportService } from './transport.service';
import { CreateTransportRequestDto, UpdateShipmentStatusDto } from './dto/transport.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('transport-requests')
export class TransportRequestsController {
  constructor(private transportService: TransportService) {}

  @Post()
  create(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: Role,
    @Body() dto: CreateTransportRequestDto,
  ) {
    return this.transportService.createTransportRequest(userId, role, dto);
  }

  @Public()
  @Get()
  listPublic() {
    return this.transportService.listPublicRequests();
  }

  @Get('mine')
  myRequests(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: Role,
  ) {
    return this.transportService.listMyRequests(userId, role);
  }

  @Roles(Role.TRANSPORTER)
  @Put(':id/accept')
  accept(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.transportService.respondToRequest(userId, id, true);
  }

  @Roles(Role.TRANSPORTER)
  @Put(':id/reject')
  reject(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.transportService.respondToRequest(userId, id, false);
  }

  @Roles(Role.ADMIN, Role.TRANSPORTER)
  @Post(':id/match')
  match(
    @Param('id', ParseIntPipe) id: number,
    @Body('transporterId') transporterId?: number,
  ) {
    if (!transporterId) {
      throw new BadRequestException('transporterId is required');
    }
    return this.transportService.matchTransporter(id, transporterId);
  }

  @Roles(Role.TRANSPORTER)
  @Put('shipments/:shipmentId/status')
  updateShipment(
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    return this.transportService.updateShipmentStatus(shipmentId, dto);
  }
}