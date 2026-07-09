import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FulfillmentStatus, KitchenStatus, PaymentStatus } from '@prisma/client';

import {
  NotificationsService,
  WhatsappMessageType,
} from '../notifications/notifications.service';
import { ProductsRepository } from '../products/products.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateFulfillmentStatusDto } from './dto/update-fulfillment-status.dto';
import { UpdateKitchenStatusDto } from './dto/update-kitchen-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { OrderFilters, OrdersRepository } from './orders.repository';

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING_CONFIRMATION: [PaymentStatus.CONFIRMED, PaymentStatus.FAILED],
  CONFIRMED: [PaymentStatus.REFUNDED],
  FAILED: [PaymentStatus.PENDING_CONFIRMATION],
  REFUNDED: [],
};

const KITCHEN_TRANSITIONS: Record<KitchenStatus, KitchenStatus[]> = {
  NOT_STARTED: [KitchenStatus.KITCHEN_INFORMED],
  KITCHEN_INFORMED: [KitchenStatus.PREPARING],
  PREPARING: [KitchenStatus.READY],
  READY: [],
};

const FULFILLMENT_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  PENDING: [
    FulfillmentStatus.PICKED_UP,
    FulfillmentStatus.SERVED,
    FulfillmentStatus.DELIVERED,
    FulfillmentStatus.CANCELLED,
  ],
  PICKED_UP: [],
  SERVED: [],
  DELIVERED: [],
  CANCELLED: [],
};

function assertValidTransition<T extends string>(
  current: T,
  next: T,
  allowed: Record<string, T[]>,
  label: string,
): void {
  if (current === next) return;

  if (!allowed[current]?.includes(next)) {
    throw new BadRequestException(
      `Cannot change ${label} from ${current} to ${next}`,
    );
  }
}

export interface OrderLike {
  paymentStatus: PaymentStatus;
  kitchenStatus: KitchenStatus;
  fulfillmentStatus: FulfillmentStatus;
  orderType: string;
}

export function computeUnifiedStatus(order: OrderLike): string {
  if (order.fulfillmentStatus === FulfillmentStatus.CANCELLED) {
    return 'Cancelled';
  }

  if (
    (
      [
        FulfillmentStatus.PICKED_UP,
        FulfillmentStatus.SERVED,
        FulfillmentStatus.DELIVERED,
      ] as FulfillmentStatus[]
    ).includes(order.fulfillmentStatus)
  ) {
    return 'Completed';
  }

  if (order.paymentStatus === PaymentStatus.REFUNDED) {
    return 'Cancelled';
  }

  if (
    order.paymentStatus === PaymentStatus.PENDING_CONFIRMATION ||
    order.paymentStatus === PaymentStatus.FAILED
  ) {
    return 'Pending';
  }

  if (
    order.kitchenStatus === KitchenStatus.NOT_STARTED ||
    order.kitchenStatus === KitchenStatus.KITCHEN_INFORMED
  ) {
    return 'Confirmed';
  }

  if (order.kitchenStatus === KitchenStatus.PREPARING) {
    return 'Preparing';
  }

  if (order.kitchenStatus === KitchenStatus.READY) {
    if (order.orderType === 'DELIVERY') return 'Out for Delivery';
    if (order.orderType === 'PICKUP') return 'Ready for Pickup';
    return 'Ready to Serve';
  }

  return 'Pending';
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  private withUnifiedStatus<T extends OrderLike>(order: T) {
    return { ...order, unifiedStatus: computeUnifiedStatus(order) };
  }

  async getOrders(filters?: OrderFilters) {
    const orders = await this.ordersRepository.findAll(filters);
    return orders.map((order) => this.withUnifiedStatus(order));
  }

  async getOrderById(id: string) {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.withUnifiedStatus(order);
  }

  async createOrder(createOrderDto: CreateOrderDto, createdByUserId?: string) {
    const productIds = createOrderDto.items.map((item) => item.productId);

    const products = await this.productsRepository.findManyByIds(productIds);

    const productMap = new Map(products.map((product) => [product.id, product]));

    const missingIds = productIds.filter((id) => !productMap.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Product(s) not found: ${missingIds.join(', ')}`,
      );
    }

    const unavailableProducts = createOrderDto.items
      .map((item) => productMap.get(item.productId)!)
      .filter((product) => product.status !== 'ACTIVE' || !product.isAvailable);

    if (unavailableProducts.length > 0) {
      throw new BadRequestException(
        `Product(s) not available: ${unavailableProducts
          .map((product) => product.name)
          .join(', ')}`,
      );
    }

    let subtotal = 0;
    const items = createOrderDto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      };
    });

    const discountAmount = createOrderDto.discountAmount ?? 0;
    const totalAmount = Math.max(subtotal - discountAmount, 0);

    const order = await this.ordersRepository.create({
      orderNumber: generateOrderNumber(),
      customerName: createOrderDto.customerName,
      customerPhone: createOrderDto.customerPhone,
      customerEmail: createOrderDto.customerEmail,
      channel: createOrderDto.channel,
      orderType: createOrderDto.orderType,
      tableNumber: createOrderDto.tableNumber,
      deliveryAddress: createOrderDto.deliveryAddress,
      notes: createOrderDto.notes,
      subtotal,
      discountAmount,
      totalAmount,
      createdByUserId,
      items,
    });

    await this.notificationsService.notifyNewOrder(order);

    return this.withUnifiedStatus(order);
  }

  async updatePaymentStatus(
    id: string,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
    changedByUserId?: string,
  ) {
    const order = await this.getOrderById(id);
    const nextStatus = updatePaymentStatusDto.paymentStatus;

    assertValidTransition(
      order.paymentStatus,
      nextStatus,
      PAYMENT_TRANSITIONS,
      'payment status',
    );

    let updatedOrder = await this.ordersRepository.updatePaymentStatus(
      id,
      nextStatus,
    );

    await this.ordersRepository.logStatusChange({
      orderId: id,
      userId: changedByUserId,
      description: `Payment status changed from ${order.paymentStatus} to ${nextStatus}`,
    });

    if (
      nextStatus === PaymentStatus.CONFIRMED &&
      order.kitchenStatus === KitchenStatus.NOT_STARTED
    ) {
      updatedOrder = await this.ordersRepository.updateKitchenStatus(
        id,
        KitchenStatus.KITCHEN_INFORMED,
      );

      await this.ordersRepository.logStatusChange({
        orderId: id,
        userId: changedByUserId,
        description:
          'Kitchen status auto-advanced from NOT_STARTED to KITCHEN_INFORMED (payment confirmed)',
      });
    }

    return this.withUnifiedStatus(updatedOrder);
  }

  async updateKitchenStatus(
    id: string,
    updateKitchenStatusDto: UpdateKitchenStatusDto,
    changedByUserId?: string,
  ) {
    const order = await this.getOrderById(id);
    const nextStatus = updateKitchenStatusDto.kitchenStatus;

    assertValidTransition(
      order.kitchenStatus,
      nextStatus,
      KITCHEN_TRANSITIONS,
      'kitchen status',
    );

    const updatedOrder = await this.ordersRepository.updateKitchenStatus(
      id,
      nextStatus,
    );

    await this.ordersRepository.logStatusChange({
      orderId: id,
      userId: changedByUserId,
      description: `Kitchen status changed from ${order.kitchenStatus} to ${nextStatus}`,
    });

    return this.withUnifiedStatus(updatedOrder);
  }

  async updateFulfillmentStatus(
    id: string,
    updateFulfillmentStatusDto: UpdateFulfillmentStatusDto,
    changedByUserId?: string,
  ) {
    const order = await this.getOrderById(id);
    const nextStatus = updateFulfillmentStatusDto.fulfillmentStatus;

    assertValidTransition(
      order.fulfillmentStatus,
      nextStatus,
      FULFILLMENT_TRANSITIONS,
      'fulfillment status',
    );

    const updatedOrder = await this.ordersRepository.updateFulfillmentStatus(
      id,
      nextStatus,
    );

    await this.ordersRepository.logStatusChange({
      orderId: id,
      userId: changedByUserId,
      description: `Fulfillment status changed from ${order.fulfillmentStatus} to ${nextStatus}`,
    });

    return this.withUnifiedStatus(updatedOrder);
  }

  async markPaymentClaimed(id: string) {
    await this.getOrderById(id);

    const order = await this.ordersRepository.markPaymentClaimed(id);

    await this.notificationsService.notifyPaymentClaimed(order);

    return order;
  }

  async sendWhatsAppNotification(
    id: string,
    type: WhatsappMessageType,
    customMessage?: string,
  ) {
    const order = await this.getOrderById(id);

    await this.notificationsService.sendOrderStatusMessage(
      order,
      type,
      customMessage,
    );

    return { success: true };
  }

  async getOrderAuditLog(id: string) {
    await this.getOrderById(id);

    return this.ordersRepository.findAuditLogs(id);
  }
}
