import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { EventsPublicController } from './events-public.controller';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  controllers: [EventsController, EventsPublicController],
  providers: [EventsService, PrismaService],
})
export class EventsModule {}
