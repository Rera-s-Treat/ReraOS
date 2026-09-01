import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { OrdersService } from './orders.service';

@ApiTags('Order Tracking')
@Controller('orders/track')
export class OrderTrackingController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Look up an order by order number (public, for customer order tracking)' })
  async track(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.trackOrder(orderNumber);
  }
}
