import { Controller, Get, Put, Param, ParseIntPipe, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser('id') userId: number, @Query('limit') limit?: string) {
    return this.notificationsService.listForUser(userId, limit ? Number(limit) : undefined);
  }

  @Get('unread-count')
  unread(@CurrentUser('id') userId: number) {
    return this.notificationsService.unreadCount(userId);
  }

  @Put(':id/read')
  markRead(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markRead(userId, id);
  }

  @Put('read-all')
  markAll(@CurrentUser('id') userId: number) {
    return this.notificationsService.markAllRead(userId);
  }
}