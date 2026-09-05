import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { JournalPublicController } from './journal-public.controller';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';

@Module({
  controllers: [JournalController, JournalPublicController],
  providers: [JournalService, PrismaService],
})
export class JournalModule {}
