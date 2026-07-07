export type CustomerSegment = 'new' | 'repeat' | 'vip' | 'inactive';

export interface Customer {
  phone: string;
  displayName: string;
  email?: string | null;
  totalOrders: number;
  totalSpend: number;
  averageOrderValue: number;
  firstOrderAt: string;
  lastOrderAt: string;
  tags: string[];
  notes?: string | null;
}

export interface CustomerFilters {
  search?: string;
  segment?: CustomerSegment;
  firstOrderFrom?: string;
  firstOrderTo?: string;
  lastOrderFrom?: string;
  lastOrderTo?: string;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  kitchenStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  itemsSummary: string;
}

export interface CustomerUnpaidOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export interface CustomerProductBehaviorItem {
  productId: string;
  name: string;
  quantity: number;
  category?: string | null;
}

export interface CustomerDetail {
  phone: string;
  displayName: string;
  email?: string | null;
  notes?: string | null;
  tags: string[];
  profile: {
    firstOrderAt: string;
    lastOrderAt: string;
    totalOrders: number;
    totalSpend: number;
    averageOrderValue: number;
  };
  orders: CustomerOrderSummary[];
  productBehavior: {
    mostOrderedItems: CustomerProductBehaviorItem[];
    favoriteCategory: string | null;
    lastOrderedItems: Array<{ productId: string; name: string; quantity: number }>;
  };
  unpaidOrders: CustomerUnpaidOrder[];
}

export interface UpdateCustomerPayload {
  displayName?: string;
  notes?: string;
  tags?: string[];
}
