import { Injectable } from '@nestjs/common';
import {
  AuditAction,
  FulfillmentStatus,
  KitchenStatus,
  OrderChannel,
  OrderType,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';

const orderInclude = {
  items: {
    include: {
      product: {
        select: { id: true, name: true, sku: true },
      },
    },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true },
  },
} as const;

export interface OrderFilters {
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  kitchenStatus?: KitchenStatus;
  search?: string;
}

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: OrderFilters) {
    const where: Prisma.OrderWhereInput = {};

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.fulfillmentStatus) {
      where.fulfillmentStatus = filters.fulfillmentStatus;
    }

    if (filters?.kitchenStatus) {
      where.kitchenStatus = filters.kitchenStatus;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      };
    }

    if (filters?.search) {
      where.OR = [
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerPhone: { contains: filters.search, mode: 'insensitive' } },
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  async create(data: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    channel: OrderChannel;
    orderType: OrderType;
    tableNumber?: string;
    deliveryAddress?: string;
    notes?: string;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    createdByUserId?: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  }) {
    return this.prisma.order.create({
      data: {
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        channel: data.channel,
        orderType: data.orderType,
        tableNumber: data.tableNumber,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        subtotal: data.subtotal,
        discountAmount: data.discountAmount,
        totalAmount: data.totalAmount,
        createdByUserId: data.createdByUserId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: orderInclude,
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { paymentStatus },
      include: orderInclude,
    });
  }

  async updateKitchenStatus(id: string, kitchenStatus: KitchenStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { kitchenStatus },
      include: orderInclude,
    });
  }

  async updateFulfillmentStatus(
    id: string,
    fulfillmentStatus: FulfillmentStatus,
  ) {
    return this.prisma.order.update({
      where: { id },
      data: { fulfillmentStatus },
      include: orderInclude,
    });
  }

  async markPaymentClaimed(id: string) {
    return this.prisma.order.update({
      where: { id },
      data: { paymentClaimedAt: new Date() },
      include: orderInclude,
    });
  }

  async logStatusChange(data: {
    orderId: string;
    userId?: string;
    description: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: AuditAction.ORDER_STATUS_CHANGED,
        orderId: data.orderId,
        userId: data.userId,
        description: data.description,
      },
    });
  }

  async findAuditLogs(orderId: string) {
    return this.prisma.auditLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });
  }
}
