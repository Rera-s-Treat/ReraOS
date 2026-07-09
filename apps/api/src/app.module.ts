import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { WhatsappSessionsModule } from './modules/whatsapp/whatsapp-sessions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CustomersModule } from './modules/customers/customers.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    RolesModule,
    InventoryModule,
    ProductsModule,
    OrdersModule,
    WhatsappSessionsModule,
    DashboardModule,
    CustomersModule,
  ],
})
export class AppModule {}
