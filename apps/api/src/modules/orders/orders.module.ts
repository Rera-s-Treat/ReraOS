import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { ProductsModule } from '../products/products.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [ProductsModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}
