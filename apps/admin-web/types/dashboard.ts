export interface DashboardOverview {
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface OrderStatusSummary {
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  completed: number;
  cancelled: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  image?: string | null;
  quantitySold: number;
  revenue: number;
}

export interface InventoryAlertItem {
  id: string;
  name: string;
  sku: string;
  quantityInStock: number;
  reorderLevel: number;
}

export interface InventoryAlerts {
  lowStock: InventoryAlertItem[];
  outOfStock: InventoryAlertItem[];
  needingRestockCount: number;
}

export interface ActionQueueOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentStatus: string;
  kitchenStatus: string;
  fulfillmentStatus: string;
  orderType: string;
  createdAt: string;
  unifiedStatus: string;
}

export interface ActionQueue {
  recentOrders: ActionQueueOrder[];
  unpaidOrders: ActionQueueOrder[];
  pendingConfirmationOrders: ActionQueueOrder[];
}
