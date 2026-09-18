import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { OrdersService } from './orders.service';

@ApiTags('Order Invoice (public)')
@Controller('public/orders')
export class OrderInvoiceController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id/invoice')
  @ApiOperation({ summary: "An order's shareable invoice (public, keyed by the order's own id)" })
  async getInvoice(@Param('id') id: string) {
    return this.ordersService.getInvoice(id);
  }
}
