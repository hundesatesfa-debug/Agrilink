import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async listForUser(userId: number, limit = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async unreadCount(userId: number) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  async markRead(userId: number, notificationId: number) {
    const n = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!n || n.userId !== userId) return null;
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async create(userId: number, data: {
    type?: NotificationType;
    title: string;
    titleOm?: string;
    body: string;
    bodyOm?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return this.prisma.notification.create({
      data: {
        userId,
        type: data.type || NotificationType.GENERAL,
        title: data.title,
        titleOm: data.titleOm,
        body: data.body,
        bodyOm: data.bodyOm,
      },
    });
  }

  // Provider abstraction: in-app is implemented; SMS/push can be plugged in later.
  async broadcast(data: {
    type?: NotificationType;
    title: string;
    titleOm?: string;
    body: string;
    bodyOm?: string;
    role?: 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'ADMIN';
  }) {
    const users = await this.prisma.user.findMany({
      where: { ...(data.role ? { role: data.role } : {}) },
      select: { id: true },
    });
    for (const u of users) {
      await this.create(u.id, data);
    }
    return { broadcastTo: users.length };
  }
}