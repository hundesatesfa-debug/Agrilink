import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { FarmsService } from './farms.service';
import { CreateFarmDto, UpdateFarmDto, AddFarmCropDto } from './dto/farm.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('farms')
@Roles(Role.FARMER)
export class FarmsController {
  constructor(private farmsService: FarmsService) {}

  @Get()
  list(@CurrentUser('id') userId: number) {
    return this.farmsService.listFarms(userId);
  }

  @Get(':id')
  get(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.farmsService.getFarm(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: number, @Body() dto: CreateFarmDto) {
    return this.farmsService.createFarm(userId, dto);
  }

  @Put(':id')
  update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFarmDto,
  ) {
    return this.farmsService.updateFarm(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.farmsService.deleteFarm(userId, id);
  }

  @Post(':id/crops')
  addCrop(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddFarmCropDto,
  ) {
    return this.farmsService.addCrop(userId, id, dto);
  }

  @Delete(':id/crops/:cropId')
  removeCrop(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('cropId', ParseIntPipe) cropId: number,
  ) {
    return this.farmsService.removeCrop(userId, id, cropId);
  }
}
