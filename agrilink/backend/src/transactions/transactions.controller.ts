import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionStatusDto } from './dto/transaction.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  create(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: Role,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, role, dto);
  }

  @Get('mine')
  mine(@CurrentUser('id') userId: number, @CurrentUser('role') role: Role) {
    return this.transactionsService.listMine(userId, role);
  }

  @Get()
  @Roles(Role.ADMIN)
  all(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.transactionsService.listAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Put(':id/status')
  updateStatus(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: Role,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionStatusDto,
  ) {
    return this.transactionsService.updateStatus(userId, role, id, dto);
  }
}