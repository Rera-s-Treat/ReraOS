import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { InventoryController } from './inventory.controller';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';

@Module({
  imports: [NotificationsModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRepository, PrismaService],
})
export class InventoryModule {}
