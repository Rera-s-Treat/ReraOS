import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { StaffPublicController } from './staff-public.controller';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  controllers: [StaffController, StaffPublicController],
  providers: [StaffService, PrismaService],
})
export class StaffModule {}
