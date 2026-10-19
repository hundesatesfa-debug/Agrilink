import { Controller, Get, Put, Body, Post } from '@nestjs/common';
import { TransportService } from './transport.service';
import { CreateVehicleDto, UpdateTransporterDto } from './dto/transport.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../auth/public.decorator';
import { Role } from '@prisma/client';

@Controller('transporters')
export class TransportersController {
  constructor(private transportService: TransportService) {}

  @Public()
  @Get()
  listPublic() {
    return this.transportService.listPublicTransporters();
  }

  @Get('me')
  @Roles(Role.TRANSPORTER)
  me(@CurrentUser('id') userId: number) {
    return this.transportService.getTransporterByUserId(userId);
  }

  @Put('me')
  @Roles(Role.TRANSPORTER)
  updateMe(@CurrentUser('id') userId: number, @Body() dto: UpdateTransporterDto) {
    return this.transportService.updateTransporter(userId, dto);
  }

  @Post('me/vehicles')
  @Roles(Role.TRANSPORTER)
  addVehicle(@CurrentUser('id') userId: number, @Body() dto: CreateVehicleDto) {
    return this.transportService.addVehicle(userId, dto);
  }
}