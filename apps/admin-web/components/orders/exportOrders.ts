import { downloadCsv } from '@/lib/csv';
import { Order, PAYMENT_METHOD_LABELS } from '../../types/order';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Local (browser) date and time, so the file matches what staff see on screen.
function localDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function localTime(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function itemName(item: Order['items'][number]): string {
  return item.product?.name ?? item.customDescription ?? 'Item';
}

function amountPaid(order: Order): number {
  return (order.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
}

function fileStamp(): string {
  return localDate(new Date().toISOString());
}

/** One row per order. */
export function exportOrdersCsv(orders: Order[]) {
  downloadCsv(
    `rera-orders-${fileStamp()}.csv`,
    [
      'Order #',
      'Date',
      'Time',
      'Customer',
      'Phone',
      'Email',
      'Channel',
      'Order Type',
      'Items',
      'Item Count',
      'Subtotal (NGN)',
      'Discount (NGN)',
      'Total (NGN)',
      'Amount Paid (NGN)',
      'Balance (NGN)',
      'Payment Method',
      'Payment Status',
      'Kitchen Status',
      'Fulfillment Status',
      'Table',
      'Delivery Address',
      'Notes',
      'Created By',
    ],
    orders.map((order) => {
      const paid = amountPaid(order);
      return [
        order.orderNumber,
        localDate(order.createdAt),
        localTime(order.createdAt),
        order.customerName,
        order.customerPhone,
        order.customerEmail ?? '',
        order.channel,
        order.orderType,
        order.items.map((item) => `${item.quantity}x ${itemName(item)}`).join('; '),
        order.items.reduce((sum, item) => sum + item.quantity, 0),
        Number(order.subtotal),
        Number(order.discountAmount),
        Number(order.totalAmount),
        paid,
        Math.max(Number(order.totalAmount) - paid, 0),
        PAYMENT_METHOD_LABELS[order.paymentMethod ?? 'TRANSFER'],
        order.paymentStatus,
        order.kitchenStatus,
        order.fulfillmentStatus,
        order.tableNumber ?? '',
        order.deliveryAddress ?? '',
        order.notes ?? '',
        order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : '',
      ];
    }),
  );
}

/** One row per line item - for seeing what sold. */
export function exportOrderItemsCsv(orders: Order[]) {
  downloadCsv(
    `rera-order-items-${fileStamp()}.csv`,
    [
      'Order #',
      'Date',
      'Customer',
      'Channel',
      'Item',
      'Quantity',
      'Unit Price (NGN)',
      'Line Total (NGN)',
      'Payment Method',
      'Payment Status',
      'Fulfillment Status',
    ],
    orders.flatMap((order) =>
      order.items.map((item) => [
        order.orderNumber,
        localDate(order.createdAt),
        order.customerName,
        order.channel,
        itemName(item),
        item.quantity,
        Number(item.unitPrice),
        Number(item.lineTotal),
        PAYMENT_METHOD_LABELS[order.paymentMethod ?? 'TRANSFER'],
        order.paymentStatus,
        order.fulfillmentStatus,
      ]),
    ),
  );
}
