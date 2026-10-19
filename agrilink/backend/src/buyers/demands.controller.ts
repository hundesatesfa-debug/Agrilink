import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { CreateDemandDto, UpdateDemandDto, UpdateBuyerProfileDto } from './dto/buyer.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('buyers/me')
@Roles(Role.BUYER)
export class DemandsController {
  constructor(private buyersService: BuyersService) {}

  @Get()
  myProfile(@CurrentUser('id') userId: number) {
    return this.buyersService.getMyProfile(userId);
  }

  @Put()
  updateProfile(@CurrentUser('id') userId: number, @Body() dto: UpdateBuyerProfileDto) {
    return this.buyersService.updateMyProfile(userId, dto);
  }

  @Get('demands')
  myDemands(@CurrentUser('id') userId: number) {
    return this.buyersService.listMyDemands(userId);
  }

  @Post('demands')
  createDemand(@CurrentUser('id') userId: number, @Body() dto: CreateDemandDto) {
    return this.buyersService.createDemand(userId, dto);
  }

  @Put('demands/:id')
  updateDemand(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDemandDto,
  ) {
    return this.buyersService.updateDemand(userId, id, dto);
  }

  @Delete('demands/:id')
  deleteDemand(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.buyersService.deleteDemand(userId, id);
  }
}