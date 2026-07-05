import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { WhatsappSessionsModule } from './modules/whatsapp/whatsapp-sessions.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    RolesModule,
    InventoryModule,
    ProductsModule,
    OrdersModule,
    WhatsappSessionsModule,
  ],
})
export class AppModule {}
