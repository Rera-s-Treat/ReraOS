import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  EventStatus,
  KitchenStatus,
  NotificationCategory,
  NotificationType,
  PaymentStatus,
} from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from './notifications.service';

const STUCK_PENDING_HOURS = Number(process.env.STUCK_PENDING_HOURS ?? 2);
const READY_NOT_PICKED_UP_HOURS = Number(
  process.env.READY_NOT_PICKED_UP_HOURS ?? 1,
);

function formatNaira(amount: unknown): string {
  return `₦${Number(amount).toLocaleString()}`;
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function dayRange(daysFromNow: number): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatEventDate(eventDate: Date | null): string {
  if (!eventDate) return 'TBD';
  return eventDate.toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatEventTime(eventDate: Date | null): string {
  if (!eventDate) return 'TBD';
  return eventDate.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger(NotificationsSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Every day at 23:55 server time. */
  @Cron('55 23 * * *')
  async sendDailySalesSummary(): Promise<void> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { totalAmount: true, paymentStatus: true },
    });

    let revenue = 0;
    let confirmedCount = 0;
    for (const order of orders) {
      if (order.paymentStatus === PaymentStatus.CONFIRMED) {
        revenue += Number(order.totalAmount);
        confirmedCount += 1;
      }
    }

    const message = [
      `Daily sales summary for ${todayStart.toLocaleDateString()}:`,
      `Orders: ${orders.length}`,
      `Confirmed revenue: ${formatNaira(revenue)}`,
      `Average order value: ${confirmedCount > 0 ? formatNaira(revenue / confirmedCount) : '₦0'}`,
    ].join('\n');

    await this.notificationsService.notifyAdmin({
      type: NotificationType.DAILY_SALES_SUMMARY,
      category: NotificationCategory.SYSTEM,
      title: `Daily Sales Summary — ${todayStart.toLocaleDateString()}`,
      message,
    });
  }

  /** Every Monday at 08:00 server time. */
  @Cron('0 8 * * 1')
  async sendWeeklyPerformanceSummary(): Promise<void> {
    const weekStart = hoursAgo(7 * 24);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { totalAmount: true, paymentStatus: true },
    });

    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { createdAt: { gte: weekStart } },
      _sum: { quantity: true },
    });

    let revenue = 0;
    let confirmedCount = 0;
    for (const order of orders) {
      if (order.paymentStatus === PaymentStatus.CONFIRMED) {
        revenue += Number(order.totalAmount);
        confirmedCount += 1;
      }
    }

    const topProductIds = items
      .sort((a, b) => (b._sum.quantity ?? 0) - (a._sum.quantity ?? 0))
      .slice(0, 3)
      .map((row) => row.productId);

    const topProducts = await this.prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true },
    });
    const productNameById = new Map(topProducts.map((p) => [p.id, p.name]));

    const message = [
      `Weekly performance summary (last 7 days):`,
      `Orders: ${orders.length}`,
      `Confirmed revenue: ${formatNaira(revenue)}`,
      `Average order value: ${confirmedCount > 0 ? formatNaira(revenue / confirmedCount) : '₦0'}`,
      topProductIds.length > 0
        ? `Top products: ${topProductIds.map((id) => productNameById.get(id) ?? 'Unknown').join(', ')}`
        : 'Top products: none',
    ].join('\n');

    await this.notificationsService.notifyAdmin({
      type: NotificationType.WEEKLY_PERFORMANCE_SUMMARY,
      category: NotificationCategory.SYSTEM,
      title: 'Weekly Performance Summary',
      message,
    });
  }

  /** Every hour: flag orders whose payment has been pending too long. */
  @Cron('0 * * * *')
  async checkStuckPendingOrders(): Promise<void> {
    const cutoff = hoursAgo(STUCK_PENDING_HOURS);

    const stuckOrders = await this.prisma.order.findMany({
      where: {
        paymentStatus: PaymentStatus.PENDING_CONFIRMATION,
        createdAt: { lte: cutoff },
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        createdAt: true,
      },
    });

    for (const order of stuckOrders) {
      const alreadyFlagged = await this.prisma.notification.findFirst({
        where: {
          orderId: order.id,
          type: NotificationType.ORDER_STUCK_PENDING,
        },
      });
      if (alreadyFlagged) continue;

      await this.notificationsService.notifyAdmin({
        type: NotificationType.ORDER_STUCK_PENDING,
        category: NotificationCategory.ORDER,
        title: `Order Stuck Pending — ${order.orderNumber}`,
        message: `Order ${order.orderNumber} (${order.customerName}, ${order.customerPhone}) has been awaiting payment confirmation since ${order.createdAt.toLocaleString()} — over ${STUCK_PENDING_HOURS}h ago.`,
        orderId: order.id,
      });
    }

    if (stuckOrders.length > 0) {
      this.logger.log(
        `Checked stuck-pending orders, flagged up to ${stuckOrders.length}.`,
      );
    }
  }

  /** Every hour: flag pickup orders that are ready but not yet collected. */
  @Cron('30 * * * *')
  async checkReadyNotPickedUp(): Promise<void> {
    const cutoff = hoursAgo(READY_NOT_PICKED_UP_HOURS);

    const readyOrders = await this.prisma.order.findMany({
      where: {
        kitchenStatus: KitchenStatus.READY,
        orderType: 'PICKUP',
        fulfillmentStatus: 'PENDING',
        updatedAt: { lte: cutoff },
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        updatedAt: true,
      },
    });

    for (const order of readyOrders) {
      const alreadyFlagged = await this.prisma.notification.findFirst({
        where: {
          orderId: order.id,
          type: NotificationType.ORDER_READY_NOT_PICKED_UP,
        },
      });
      if (alreadyFlagged) continue;

      await this.notificationsService.notifyAdmin({
        type: NotificationType.ORDER_READY_NOT_PICKED_UP,
        category: NotificationCategory.ORDER,
        title: `Order Ready, Not Picked Up — ${order.orderNumber}`,
        message: `Order ${order.orderNumber} (${order.customerName}, ${order.customerPhone}) has been ready for pickup since ${order.updatedAt.toLocaleString()} — over ${READY_NOT_PICKED_UP_HOURS}h ago.`,
        orderId: order.id,
      });
    }
  }

  /** Every day at 09:00 server time: remind guests 3 days ahead of an event they RSVP'd to. */
  @Cron('0 9 * * *')
  async sendEventReminders3Days(): Promise<void> {
    const { start, end } = dayRange(3);

    const events = await this.prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        eventDate: { gte: start, lte: end },
      },
      include: {
        rsvps: { where: { email: { not: null }, reminder3dSentAt: null } },
      },
    });

    for (const event of events) {
      for (const rsvp of event.rsvps) {
        const body = `Hi ${firstName(rsvp.name)},

Just a little heads-up: **${event.title} is in 3 days.**

**${formatEventDate(event.eventDate)} · ${formatEventTime(event.eventDate)}**

We've got the food, the treats and the good company waiting.

You just need to show up. 😉

See you soon,

**Rera's Treat**`;

        await this.notificationsService.sendEmail(
          rsvp.email!,
          `${event.title} is in 3 days!`,
          body,
        );
        await this.prisma.eventRsvp.update({
          where: { id: rsvp.id },
          data: { reminder3dSentAt: new Date() },
        });
      }
    }
  }

  /** Every day at 08:00 server time: remind guests the event they RSVP'd to is happening today. */
  @Cron('0 8 * * *')
  async sendEventRemindersToday(): Promise<void> {
    const { start, end } = dayRange(0);

    const events = await this.prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        eventDate: { gte: start, lte: end },
      },
      include: {
        rsvps: { where: { email: { not: null }, reminderDaySentAt: null } },
      },
    });

    for (const event of events) {
      for (const rsvp of event.rsvps) {
        const body = `Hi ${firstName(rsvp.name)},

Today's the day. ✨

**${event.title}** is happening today at **${formatEventTime(event.eventDate)}**.

Your RSVP is confirmed, so all that's left is to come as you are and enjoy yourself.

We'll have the treats ready.

**See you soon,**
Rera's Treat`;

        await this.notificationsService.sendEmail(
          rsvp.email!,
          `Today's the day — ${event.title}`,
          body,
        );
        await this.prisma.eventRsvp.update({
          where: { id: rsvp.id },
          data: { reminderDaySentAt: new Date() },
        });
      }
    }
  }
}
