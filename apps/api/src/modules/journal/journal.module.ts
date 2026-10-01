import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { JournalPublicController } from './journal-public.controller';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';

@Module({
  imports: [NotificationsModule],
  controllers: [JournalController, JournalPublicController],
  providers: [JournalService, PrismaService],
})
export class JournalModule {}
