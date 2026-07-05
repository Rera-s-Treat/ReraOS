import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderChannel, Prisma, WhatsappSessionStatus } from '@prisma/client';

import { PAYMENT_ACCOUNT } from '../../common/payment-account';
import { ProductsRepository } from '../products/products.repository';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { CartItemDto, UpdateSessionDto } from './dto/update-session.dto';
import { WhatsappSessionsRepository } from './whatsapp-sessions.repository';

@Injectable()
export class WhatsappSessionsService {
  constructor(
    private readonly sessionsRepository: WhatsappSessionsRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly ordersService: OrdersService,
  ) {}

  async getMenu() {
    return this.productsRepository.findAvailable();
  }

  async startOrResumeSession(dto: StartSessionDto) {
    const existing = await this.sessionsRepository.findActiveByPhone(
      dto.customerPhone,
    );

    if (existing) {
      if (dto.customerName || dto.customerEmail) {
        return this.sessionsRepository.update(existing.id, {
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
        });
      }

      return existing;
    }

    return this.sessionsRepository.create({
      customerPhone: dto.customerPhone,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
    });
  }

  async getSessionById(id: string) {
    const session = await this.sessionsRepository.findById(id);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async updateSession(id: string, dto: UpdateSessionDto) {
    const session = await this.getSessionById(id);

    if (session.status !== WhatsappSessionStatus.ACTIVE) {
      throw new BadRequestException('This session is no longer active');
    }

    return this.sessionsRepository.update(id, {
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      currentStep: dto.currentStep,
      orderType: dto.orderType,
      cartItems: dto.cartItems as unknown as
        | Prisma.InputJsonValue
        | undefined,
      deliveryAddress: dto.deliveryAddress,
      notes: dto.notes,
    });
  }

  async checkout(id: string) {
    const session = await this.getSessionById(id);

    if (session.status !== WhatsappSessionStatus.ACTIVE) {
      throw new BadRequestException('This session is no longer active');
    }

    if (!session.customerName) {
      throw new BadRequestException(
        'Customer name is required before checkout',
      );
    }

    if (!session.orderType) {
      throw new BadRequestException('Order type is required before checkout');
    }

    if (session.orderType === 'DELIVERY' && !session.deliveryAddress) {
      throw new BadRequestException(
        'Delivery address is required for delivery orders',
      );
    }

    const cartItems = (session.cartJson as unknown as CartItemDto[]) ?? [];

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const createOrderDto: CreateOrderDto = {
      customerName: session.customerName,
      customerPhone: session.customerPhone,
      customerEmail: session.customerEmail ?? undefined,
      channel: OrderChannel.WHATSAPP,
      orderType: session.orderType,
      deliveryAddress: session.deliveryAddress ?? undefined,
      notes: session.notes ?? undefined,
      items: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    const order = await this.ordersService.createOrder(createOrderDto);

    await this.sessionsRepository.attachOrder(id, order.id);

    return {
      order,
      paymentAccount: PAYMENT_ACCOUNT,
    };
  }

  async markPaymentClaimed(id: string) {
    const session = await this.getSessionById(id);

    if (!session.orderId) {
      throw new BadRequestException(
        'Checkout has not been completed for this session',
      );
    }

    return this.ordersService.markPaymentClaimed(session.orderId);
  }
}
