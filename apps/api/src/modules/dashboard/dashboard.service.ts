import { Injectable } from '@nestjs/common';
import { InventoryStatus, KitchenStatus, PaymentStatus } from '@prisma/client';

import { normalizeNigerianPhoneNumber } from '../../common/phone';
import { PrismaService } from '../../common/prisma.service';
import { computeUnifiedStatus } from '../orders/orders.service';

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const ACTION_QUEUE_SELECT = {
  id: true,
  orderNumber: true,
  customerName: true,
  customerPhone: true,
  totalAmount: true,
  paymentStatus: true,
  kitchenStatus: true,
  fulfillmentStatus: true,
  orderType: true,
  createdAt: true,
} as const;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const todayStart = startOfDay(new Date());
    const todayEnd = addDays(todayStart, 1);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: todayStart, lt: todayEnd } },
      select: {
        totalAmount: true,
        paymentStatus: true,
        kitchenStatus: true,
        fulfillmentStatus: true,
        orderType: true,
      },
    });

    let revenueToday = 0;
    let confirmedCount = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;

    for (const order of orders) {
      const unifiedStatus = computeUnifiedStatus(order);

      if (order.paymentStatus === PaymentStatus.CONFIRMED) {
        revenueToday += Number(order.totalAmount);
        confirmedCount += 1;
      }

      if (unifiedStatus === 'Pending') pendingOrders += 1;
      if (unifiedStatus === 'Completed') completedOrders += 1;
      if (unifiedStatus === 'Cancelled') cancelledOrders += 1;
    }

    return {
      ordersToday: orders.length,
      revenueToday,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      averageOrderValue: confirmedCount > 0 ? revenueToday / confirmedCount : 0,
    };
  }

  async getSalesTrend(days: number) {
    const rangeStart = startOfDay(addDays(new Date(), -(days - 1)));

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true, totalAmount: true, paymentStatus: true },
    });

    const buckets = new Map<string, { revenue: number; orderCount: number }>();

    for (let i = 0; i < days; i++) {
      buckets.set(toDateKey(addDays(rangeStart, i)), { revenue: 0, orderCount: 0 });
    }

    for (const order of orders) {
      const bucket = buckets.get(toDateKey(order.createdAt));
      if (!bucket) continue;

      bucket.orderCount += 1;
      if (order.paymentStatus === PaymentStatus.CONFIRMED) {
        bucket.revenue += Number(order.totalAmount);
      }
    }

    return Array.from(buckets.entries()).map(([date, value]) => ({
      date,
      revenue: value.revenue,
      orderCount: value.orderCount,
    }));
  }

  async getOrderStatusSummary() {
    const orders = await this.prisma.order.findMany({
      select: {
        paymentStatus: true,
        kitchenStatus: true,
        fulfillmentStatus: true,
        orderType: true,
      },
    });

    const summary = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const order of orders) {
      switch (computeUnifiedStatus(order)) {
        case 'Pending':
          summary.pending += 1;
          break;
        case 'Confirmed':
          summary.confirmed += 1;
          break;
        case 'Preparing':
          summary.preparing += 1;
          break;
        case 'Ready for Pickup':
        case 'Out for Delivery':
        case 'Ready to Serve':
          summary.ready += 1;
          break;
        case 'Completed':
          summary.completed += 1;
          break;
        case 'Cancelled':
          summary.cancelled += 1;
          break;
      }
    }

    return summary;
  }

  async getTopProducts(days: number, by: 'quantity' | 'revenue', limit: number) {
    const rangeStart = startOfDay(addDays(new Date(), -(days - 1)));

    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { createdAt: { gte: rangeStart } },
      _sum: { quantity: true, lineTotal: true },
    });

    const ranked = grouped
      .map((row) => ({
        productId: row.productId,
        quantitySold: row._sum.quantity ?? 0,
        revenue: Number(row._sum.lineTotal ?? 0),
      }))
      .sort((a, b) =>
        by === 'revenue' ? b.revenue - a.revenue : b.quantitySold - a.quantitySold,
      )
      .slice(0, limit);

    const products = await this.prisma.product.findMany({
      where: { id: { in: ranked.map((row) => row.productId) } },
      select: { id: true, name: true, images: true },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    return ranked.map((row) => ({
      productId: row.productId,
      name: productMap.get(row.productId)?.name ?? 'Unknown product',
      image: productMap.get(row.productId)?.images?.[0] ?? null,
      quantitySold: row.quantitySold,
      revenue: row.revenue,
    }));
  }

  async getInventoryAlerts() {
    const items = await this.prisma.inventoryItem.findMany({
      where: { status: InventoryStatus.ACTIVE },
      orderBy: { name: 'asc' },
    });

    const toAlertItem = (item: (typeof items)[number]) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantityInStock: item.quantityInStock,
      reorderLevel: item.reorderLevel,
    });

    const outOfStock = items.filter((item) => item.quantityInStock <= 0);
    const lowStock = items.filter(
      (item) => item.quantityInStock > 0 && item.quantityInStock <= item.reorderLevel,
    );

    return {
      lowStock: lowStock.map(toAlertItem),
      outOfStock: outOfStock.map(toAlertItem),
      needingRestockCount: lowStock.length + outOfStock.length,
    };
  }

  async getAllTimeOverview() {
    const orders = await this.prisma.order.findMany({
      select: {
        totalAmount: true,
        paymentStatus: true,
        customerPhone: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (orders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        averageOrderValue: 0,
        firstOrderAt: null,
        lastOrderAt: null,
      };
    }

    let totalRevenue = 0;
    let confirmedCount = 0;
    const customers = new Set<string>();

    for (const order of orders) {
      customers.add(normalizeNigerianPhoneNumber(order.customerPhone));

      if (order.paymentStatus === PaymentStatus.CONFIRMED) {
        totalRevenue += Number(order.totalAmount);
        confirmedCount += 1;
      }
    }

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalCustomers: customers.size,
      averageOrderValue: confirmedCount > 0 ? totalRevenue / confirmedCount : 0,
      firstOrderAt: orders[0].createdAt,
      lastOrderAt: orders[orders.length - 1].createdAt,
    };
  }

  async getMonthlyAnalytics() {
    const orders = await this.prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'asc' },
    });

    if (orders.length === 0) return [];

    const firstOrderMonthByPhone = new Map<string, string>();
    for (const order of orders) {
      const phone = normalizeNigerianPhoneNumber(order.customerPhone);
      if (!firstOrderMonthByPhone.has(phone)) {
        firstOrderMonthByPhone.set(phone, toMonthKey(order.createdAt));
      }
    }

    const monthGroups = new Map<string, typeof orders>();
    for (const order of orders) {
      const key = toMonthKey(order.createdAt);
      const group = monthGroups.get(key);
      if (group) {
        group.push(order);
      } else {
        monthGroups.set(key, [order]);
      }
    }

    return Array.from(monthGroups.keys())
      .sort()
      .map((month) => {
        const monthOrders = monthGroups.get(month)!;

        let revenue = 0;
        let confirmedCount = 0;
        const paymentBreakdown = {
          CONFIRMED: 0,
          PENDING_CONFIRMATION: 0,
          FAILED: 0,
          REFUNDED: 0,
        };

        const productAgg = new Map<
          string,
          { productId: string; name: string; quantitySold: number; revenue: number }
        >();
        const customerAgg = new Map<
          string,
          { phone: string; name: string; totalSpend: number; orders: number }
        >();
        const seenPhonesThisMonth = new Set<string>();
        let newCustomers = 0;

        for (const order of monthOrders) {
          const phone = normalizeNigerianPhoneNumber(order.customerPhone);
          const isConfirmed = order.paymentStatus === PaymentStatus.CONFIRMED;

          paymentBreakdown[order.paymentStatus] += 1;

          if (isConfirmed) {
            revenue += Number(order.totalAmount);
            confirmedCount += 1;
          }

          const custExisting = customerAgg.get(phone);
          const spendDelta = isConfirmed ? Number(order.totalAmount) : 0;
          if (custExisting) {
            custExisting.totalSpend += spendDelta;
            custExisting.orders += 1;
          } else {
            customerAgg.set(phone, {
              phone,
              name: order.customerName,
              totalSpend: spendDelta,
              orders: 1,
            });
          }

          for (const item of order.items) {
            const existing = productAgg.get(item.productId);
            const lineRevenue = Number(item.lineTotal);

            if (existing) {
              existing.quantitySold += item.quantity;
              existing.revenue += lineRevenue;
            } else {
              productAgg.set(item.productId, {
                productId: item.productId,
                name: item.product.name,
                quantitySold: item.quantity,
                revenue: lineRevenue,
              });
            }
          }

          if (!seenPhonesThisMonth.has(phone)) {
            seenPhonesThisMonth.add(phone);
            if (firstOrderMonthByPhone.get(phone) === month) {
              newCustomers += 1;
            }
          }
        }

        return {
          month,
          orders: monthOrders.length,
          revenue,
          averageOrderValue: confirmedCount > 0 ? revenue / confirmedCount : 0,
          paymentBreakdown: {
            confirmed: paymentBreakdown.CONFIRMED,
            pendingConfirmation: paymentBreakdown.PENDING_CONFIRMATION,
            failed: paymentBreakdown.FAILED,
            refunded: paymentBreakdown.REFUNDED,
          },
          newCustomers,
          returningCustomers: seenPhonesThisMonth.size - newCustomers,
          topProducts: Array.from(productAgg.values())
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, 5),
          topCustomers: Array.from(customerAgg.values())
            .sort((a, b) => b.totalSpend - a.totalSpend)
            .slice(0, 5),
        };
      });
  }

  async getActionQueue() {
    const [recentOrders, unpaidOrders, pendingConfirmationOrders] = await Promise.all([
      this.prisma.order.findMany({
        select: ACTION_QUEUE_SELECT,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.order.findMany({
        where: { paymentStatus: PaymentStatus.PENDING_CONFIRMATION },
        select: ACTION_QUEUE_SELECT,
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
      this.prisma.order.findMany({
        where: {
          paymentStatus: PaymentStatus.CONFIRMED,
          kitchenStatus: KitchenStatus.NOT_STARTED,
        },
        select: ACTION_QUEUE_SELECT,
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
    ]);

    const withStatus = (order: (typeof recentOrders)[number]) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      unifiedStatus: computeUnifiedStatus(order),
    });

    return {
      recentOrders: recentOrders.map(withStatus),
      unpaidOrders: unpaidOrders.map(withStatus),
      pendingConfirmationOrders: pendingConfirmationOrders.map(withStatus),
    };
  }
}
