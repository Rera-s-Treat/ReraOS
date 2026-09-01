import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';

import { normalizeNigerianPhoneNumber } from '../../common/phone';
import { PrismaService } from '../../common/prisma.service';
import {
  INACTIVE_DAYS_THRESHOLD,
  VIP_ORDER_THRESHOLD,
  VIP_SPEND_THRESHOLD,
} from './customers.constants';
import { FindCustomersQueryDto } from './dto/find-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

interface CustomerAggregate {
  phone: string;
  latestName: string;
  latestEmail: string | null;
  totalOrders: number;
  totalSpend: number;
  firstOrderAt: Date;
  lastOrderAt: Date;
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function computeSegmentTags(
  totalOrders: number,
  totalSpend: number,
  lastOrderAt: Date,
): string[] {
  const tags = [totalOrders === 1 ? 'NEW' : 'REPEAT'];

  if (totalSpend >= VIP_SPEND_THRESHOLD || totalOrders >= VIP_ORDER_THRESHOLD) {
    tags.push('VIP');
  }

  if (daysSince(lastOrderAt) > INACTIVE_DAYS_THRESHOLD) {
    tags.push('INACTIVE');
  }

  return tags;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildEventStats(): Promise<
    Map<string, { attended: number; rsvps: number; interests: string[] }>
  > {
    const rsvps = await this.prisma.eventRsvp.findMany({
      select: { phone: true, email: true, attendanceStatus: true, interests: true },
    });

    const byContact = new Map<
      string,
      { attended: number; rsvps: number; interests: string[] }
    >();

    for (const rsvp of rsvps) {
      const key = rsvp.phone
        ? normalizeNigerianPhoneNumber(rsvp.phone)
        : rsvp.email?.toLowerCase();
      if (!key) continue;

      const existing = byContact.get(key) ?? { attended: 0, rsvps: 0, interests: [] };
      existing.rsvps += 1;
      if (rsvp.attendanceStatus === 'ATTENDED') existing.attended += 1;
      existing.interests = Array.from(new Set([...existing.interests, ...rsvp.interests]));
      byContact.set(key, existing);
    }

    return byContact;
  }

  private async buildAggregates(): Promise<Map<string, CustomerAggregate>> {
    const orders = await this.prisma.order.findMany({
      select: {
        customerPhone: true,
        customerName: true,
        customerEmail: true,
        totalAmount: true,
        paymentStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const byPhone = new Map<string, CustomerAggregate>();

    for (const order of orders) {
      const phone = normalizeNigerianPhoneNumber(order.customerPhone);
      const spend =
        order.paymentStatus === PaymentStatus.CONFIRMED
          ? Number(order.totalAmount)
          : 0;

      const existing = byPhone.get(phone);

      if (!existing) {
        byPhone.set(phone, {
          phone,
          latestName: order.customerName,
          latestEmail: order.customerEmail,
          totalOrders: 1,
          totalSpend: spend,
          firstOrderAt: order.createdAt,
          lastOrderAt: order.createdAt,
        });
        continue;
      }

      existing.totalOrders += 1;
      existing.totalSpend += spend;
      existing.lastOrderAt = order.createdAt;
      existing.latestName = order.customerName;
      existing.latestEmail = order.customerEmail;
    }

    return byPhone;
  }

  async getCustomers(filters: FindCustomersQueryDto = {}) {
    const aggregates = await this.buildAggregates();
    const phones = Array.from(aggregates.keys());
    const eventStats = await this.buildEventStats();

    const customerRecords = await this.prisma.customer.findMany({
      where: { phone: { in: phones } },
    });
    const recordByPhone = new Map(customerRecords.map((record) => [record.phone, record]));

    let results = phones.map((phone) => {
      const aggregate = aggregates.get(phone)!;
      const record = recordByPhone.get(phone);
      const segmentTags = computeSegmentTags(
        aggregate.totalOrders,
        aggregate.totalSpend,
        aggregate.lastOrderAt,
      );
      const events = eventStats.get(phone) ??
        (aggregate.latestEmail
          ? eventStats.get(aggregate.latestEmail.toLowerCase())
          : undefined) ?? { attended: 0, rsvps: 0, interests: [] };

      return {
        phone,
        displayName: record?.displayName || aggregate.latestName,
        email: record?.email ?? aggregate.latestEmail,
        totalOrders: aggregate.totalOrders,
        totalSpend: aggregate.totalSpend,
        averageOrderValue: aggregate.totalSpend / aggregate.totalOrders,
        firstOrderAt: aggregate.firstOrderAt,
        lastOrderAt: aggregate.lastOrderAt,
        tags: Array.from(new Set([...segmentTags, ...(record?.tags ?? [])])),
        notes: record?.notes ?? null,
        eventsAttended: events.attended,
        eventRsvps: events.rsvps,
        eventInterests: events.interests,
      };
    });

    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(
        (customer) =>
          customer.displayName.toLowerCase().includes(term) ||
          customer.phone.includes(term),
      );
    }

    if (filters.segment) {
      const segmentTag = filters.segment.toUpperCase();
      results = results.filter((customer) => customer.tags.includes(segmentTag));
    }

    if (filters.firstOrderFrom) {
      const from = new Date(filters.firstOrderFrom);
      results = results.filter((customer) => customer.firstOrderAt >= from);
    }
    if (filters.firstOrderTo) {
      const to = new Date(filters.firstOrderTo);
      results = results.filter((customer) => customer.firstOrderAt <= to);
    }
    if (filters.lastOrderFrom) {
      const from = new Date(filters.lastOrderFrom);
      results = results.filter((customer) => customer.lastOrderAt >= from);
    }
    if (filters.lastOrderTo) {
      const to = new Date(filters.lastOrderTo);
      results = results.filter((customer) => customer.lastOrderAt <= to);
    }

    return results.sort((a, b) => b.lastOrderAt.getTime() - a.lastOrderAt.getTime());
  }

  async getCustomerDetail(phoneParam: string) {
    const phone = normalizeNigerianPhoneNumber(phoneParam);

    const allOrders = await this.prisma.order.findMany({
      include: { items: { include: { product: { include: { category: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const orders = allOrders.filter(
      (order) => normalizeNigerianPhoneNumber(order.customerPhone) === phone,
    );

    if (orders.length === 0) {
      throw new NotFoundException('Customer not found');
    }

    const latestOrder = orders[0];
    const totalOrders = orders.length;
    const totalSpend = orders
      .filter((order) => order.paymentStatus === PaymentStatus.CONFIRMED)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const firstOrderAt = orders[orders.length - 1].createdAt;
    const lastOrderAt = latestOrder.createdAt;

    const record = await this.prisma.customer.findUnique({ where: { phone } });
    const segmentTags = computeSegmentTags(totalOrders, totalSpend, lastOrderAt);

    const email = record?.email ?? latestOrder.customerEmail;
    const allRsvps = await this.prisma.eventRsvp.findMany({
      include: { event: { select: { title: true, slug: true, eventDate: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const matchingRsvps = allRsvps.filter(
      (rsvp) =>
        (rsvp.phone && normalizeNigerianPhoneNumber(rsvp.phone) === phone) ||
        (email && rsvp.email?.toLowerCase() === email.toLowerCase()),
    );
    const eventInterests = Array.from(
      new Set(matchingRsvps.flatMap((rsvp) => rsvp.interests)),
    );

    const productCounts = new Map<
      string,
      { productId: string; name: string; category: string | null; quantity: number }
    >();
    const categoryCounts = new Map<string, number>();

    for (const order of orders) {
      for (const item of order.items) {
        const existing = productCounts.get(item.productId);

        const categoryName = item.product.category?.name ?? null;

        if (existing) {
          existing.quantity += item.quantity;
        } else {
          productCounts.set(item.productId, {
            productId: item.productId,
            name: item.product.name,
            category: categoryName,
            quantity: item.quantity,
          });
        }

        if (categoryName) {
          categoryCounts.set(
            categoryName,
            (categoryCounts.get(categoryName) ?? 0) + item.quantity,
          );
        }
      }
    }

    const mostOrderedItems = Array.from(productCounts.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const favoriteCategory =
      Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const unpaidOrders = orders.filter(
      (order) => order.paymentStatus !== PaymentStatus.CONFIRMED,
    );

    return {
      phone,
      displayName: record?.displayName || latestOrder.customerName,
      email: record?.email ?? latestOrder.customerEmail,
      notes: record?.notes ?? null,
      tags: Array.from(new Set([...segmentTags, ...(record?.tags ?? [])])),
      profile: {
        firstOrderAt,
        lastOrderAt,
        totalOrders,
        totalSpend,
        averageOrderValue: totalSpend / totalOrders,
      },
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        paymentStatus: order.paymentStatus,
        kitchenStatus: order.kitchenStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        createdAt: order.createdAt,
        itemsSummary: order.items
          .map((item) => `${item.quantity}× ${item.product.name}`)
          .join(', '),
      })),
      productBehavior: {
        mostOrderedItems,
        favoriteCategory,
        lastOrderedItems: latestOrder.items.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
        })),
      },
      unpaidOrders: unpaidOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      })),
      events: {
        attended: matchingRsvps.filter((r) => r.attendanceStatus === 'ATTENDED').length,
        interests: eventInterests,
        rsvps: matchingRsvps.map((rsvp) => ({
          id: rsvp.id,
          eventTitle: rsvp.event.title,
          eventSlug: rsvp.event.slug,
          eventDate: rsvp.event.eventDate,
          attendanceStatus: rsvp.attendanceStatus,
          feedback: rsvp.feedback,
          feedbackRating: rsvp.feedbackRating,
          createdAt: rsvp.createdAt,
        })),
      },
    };
  }

  async updateCustomer(phoneParam: string, dto: UpdateCustomerDto) {
    const phone = normalizeNigerianPhoneNumber(phoneParam);

    return this.prisma.customer.upsert({
      where: { phone },
      update: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
      create: {
        phone,
        displayName: dto.displayName,
        notes: dto.notes,
        tags: dto.tags ?? [],
      },
    });
  }
}
