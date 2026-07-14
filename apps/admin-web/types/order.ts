export type OrderChannel = 'WHATSAPP' | 'MANUAL' | 'WALK_IN' | 'WEBSITE';
export type OrderType = 'PICKUP' | 'DELIVERY' | 'DINE_IN';
export type PaymentStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'FAILED'
  | 'REFUNDED';
export type KitchenStatus =
  | 'NOT_STARTED'
  | 'KITCHEN_INFORMED'
  | 'PREPARING'
  | 'READY';
export type FulfillmentStatus =
  | 'PENDING'
  | 'PICKED_UP'
  | 'SERVED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItemProductRef {
  id: string;
  name: string;
  sku?: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  createdAt?: string;
  product: OrderItemProductRef;
}

export interface OrderCreatedByRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  channel: OrderChannel;
  orderType: OrderType;
  tableNumber?: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  paymentStatus: PaymentStatus;
  paymentClaimedAt?: string | null;
  kitchenStatus: KitchenStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdByUserId?: string | null;
  createdBy?: OrderCreatedByRef | null;
  items: OrderItem[];
  unifiedStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderAuditLogEntry {
  id: string;
  action: string;
  description?: string | null;
  userId?: string | null;
  user?: { firstName: string; lastName: string } | null;
  createdAt: string;
}

export interface OrderFilters {
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  kitchenStatus?: KitchenStatus;
  search?: string;
}

export interface CreateOrderItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  channel: OrderChannel;
  orderType: OrderType;
  tableNumber?: string;
  deliveryAddress?: string;
  notes?: string;
  discountAmount?: number;
  items: CreateOrderItemPayload[];
}
