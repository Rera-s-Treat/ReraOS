import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { WhatsappSessionsController } from './whatsapp-sessions.controller';
import { WhatsappSessionsRepository } from './whatsapp-sessions.repository';
import { WhatsappSessionsService } from './whatsapp-sessions.service';

@Module({
  imports: [ProductsModule, OrdersModule],
  controllers: [WhatsappSessionsController],
  providers: [
    WhatsappSessionsService,
    WhatsappSessionsRepository,
    PrismaService,
  ],
})
export class WhatsappSessionsModule {}
