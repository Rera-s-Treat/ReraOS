import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsSchedulerService, PrismaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
