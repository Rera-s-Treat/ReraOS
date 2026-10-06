import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReviewsPublicController } from './reviews-public.controller';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ReviewsController, ReviewsPublicController],
  providers: [ReviewsService, PrismaService],
})
export class ReviewsModule {}
