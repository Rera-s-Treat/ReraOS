import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

@Module({
  imports: [NotificationsModule],
  controllers: [CommunityController],
  providers: [CommunityService, PrismaService],
})
export class CommunityModule {}
