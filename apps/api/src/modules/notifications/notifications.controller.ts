import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationAudience, NotificationChannel } from '@prisma/client';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { PrismaService } from '../../common/prisma.service';

@ApiTags('Notifications')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get admin in-app notifications, newest first' })
  async getNotifications(
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limitParam?: string,
  ) {
    const limit = Math.min(Math.max(Number(limitParam) || 50, 1), 200);

    return this.prisma.notification.findMany({
      where: {
        audience: NotificationAudience.ADMIN,
        channel: NotificationChannel.IN_APP,
        ...(unreadOnly === 'true' ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  @Get('unread-count')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get the count of unread admin in-app notifications' })
  async getUnreadCount() {
    const count = await this.prisma.notification.count({
      where: {
        audience: NotificationAudience.ADMIN,
        channel: NotificationChannel.IN_APP,
        isRead: false,
      },
    });

    return { count };
  }

  @Patch('read-all')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Mark all admin in-app notifications as read' })
  async markAllRead() {
    await this.prisma.notification.updateMany({
      where: {
        audience: NotificationAudience.ADMIN,
        channel: NotificationChannel.IN_APP,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  }

  @Patch(':id/read')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markRead(@Param('id') id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
