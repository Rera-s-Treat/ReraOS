import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { SendOrderUpdateDto } from './dto/send-order-update.dto';
import { UpdateFulfillmentStatusDto } from './dto/update-fulfillment-status.dto';
import { UpdateKitchenStatusDto } from './dto/update-kitchen-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({
    summary: 'Get all orders, optionally filtered by date, status, or search',
  })
  async getOrders(@Query() query: FindOrdersQueryDto) {
    return this.ordersService.getOrders(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get an order by ID' })
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Get(':id/audit-log')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get the status change history for an order' })
  async getOrderAuditLog(@Param('id') id: string) {
    return this.ordersService.getOrderAuditLog(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Create a manual, WhatsApp, or walk-in order' })
  async createOrder(
    @Body() body: CreateOrderDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.ordersService.createOrder(body, req.user.id);
  }

  @Patch(':id/payment-status')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Confirm or update the payment status of an order' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() body: UpdatePaymentStatusDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.ordersService.updatePaymentStatus(id, body, req.user.id);
  }

  @Patch(':id/kitchen-status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Move an order through the kitchen workflow' })
  async updateKitchenStatus(
    @Param('id') id: string,
    @Body() body: UpdateKitchenStatusDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.ordersService.updateKitchenStatus(id, body, req.user.id);
  }

  @Patch(':id/fulfillment-status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Update the fulfillment status of an order' })
  async updateFulfillmentStatus(
    @Param('id') id: string,
    @Body() body: UpdateFulfillmentStatusDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.ordersService.updateFulfillmentStatus(id, body, req.user.id);
  }

  @Post(':id/notify/confirmation')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Send an order confirmation message to the customer' })
  async sendConfirmationMessage(@Param('id') id: string) {
    return this.ordersService.sendOrderNotification(id, 'confirmation');
  }

  @Post(':id/notify/payment-instruction')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Send payment instructions to the customer' })
  async sendPaymentInstructionMessage(@Param('id') id: string) {
    return this.ordersService.sendOrderNotification(
      id,
      'payment-instruction',
    );
  }

  @Post(':id/notify/ready')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Send an order-ready message to the customer' })
  async sendReadyMessage(@Param('id') id: string) {
    return this.ordersService.sendOrderNotification(id, 'ready');
  }

  @Post(':id/notify/update')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({
    summary: 'Send a cancellation or custom update message to the customer',
  })
  async sendUpdateMessage(
    @Param('id') id: string,
    @Body() body: SendOrderUpdateDto,
  ) {
    return this.ordersService.sendOrderNotification(
      id,
      'update',
      body.message,
    );
  }
}
