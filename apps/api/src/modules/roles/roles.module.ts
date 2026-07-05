import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService, RolesRepository, PrismaService],
  exports: [RolesService],
})
export class RolesModule {}
