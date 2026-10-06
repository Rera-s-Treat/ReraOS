import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsPublicController } from './events-public.controller';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [CustomersModule, NotificationsModule],
  controllers: [EventsController, EventsPublicController],
  providers: [EventsService, PrismaService],
})
export class EventsModule {}
