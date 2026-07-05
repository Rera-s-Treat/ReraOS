import { Injectable } from '@nestjs/common';
import {
  OrderType,
  Prisma,
  WhatsappConversationStep,
  WhatsappSessionStatus,
} from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class WhatsappSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByPhone(customerPhone: string) {
    return this.prisma.whatsappSession.findFirst({
      where: { customerPhone, status: WhatsappSessionStatus.ACTIVE },
    });
  }

  async findById(id: string) {
    return this.prisma.whatsappSession.findUnique({
      where: { id },
      include: { order: true },
    });
  }

  async create(data: {
    customerPhone: string;
    customerName?: string;
    customerEmail?: string;
  }) {
    return this.prisma.whatsappSession.create({
      data: {
        customerPhone: data.customerPhone,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        lastMessageAt: new Date(),
      },
    });
  }

  async update(
    id: string,
    data: {
      customerName?: string;
      customerEmail?: string;
      currentStep?: WhatsappConversationStep;
      orderType?: OrderType;
      cartItems?: Prisma.InputJsonValue;
      deliveryAddress?: string;
      notes?: string;
    },
  ) {
    return this.prisma.whatsappSession.update({
      where: { id },
      data: {
        ...(data.customerName !== undefined
          ? { customerName: data.customerName }
          : {}),
        ...(data.customerEmail !== undefined
          ? { customerEmail: data.customerEmail }
          : {}),
        ...(data.currentStep !== undefined
          ? { currentStep: data.currentStep }
          : {}),
        ...(data.orderType !== undefined
          ? { orderType: data.orderType }
          : {}),
        ...(data.cartItems !== undefined
          ? { cartJson: data.cartItems }
          : {}),
        ...(data.deliveryAddress !== undefined
          ? { deliveryAddress: data.deliveryAddress }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        lastMessageAt: new Date(),
      },
    });
  }

  async attachOrder(id: string, orderId: string) {
    return this.prisma.whatsappSession.update({
      where: { id },
      data: {
        orderId,
        status: WhatsappSessionStatus.COMPLETED,
        currentStep: WhatsappConversationStep.ORDER_CREATED,
      },
      include: { order: true },
    });
  }
}
