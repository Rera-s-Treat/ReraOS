import { Order, OrderType } from './order';
import { Product } from './product';

export type WhatsappConversationStep =
  | 'START'
  | 'BROWSING_MENU'
  | 'COLLECTING_ITEMS'
  | 'COLLECTING_ORDER_TYPE'
  | 'COLLECTING_NAME'
  | 'COLLECTING_PHONE'
  | 'COLLECTING_ADDRESS'
  | 'REVIEWING_ORDER'
  | 'AWAITING_CONFIRMATION'
  | 'ORDER_CREATED';

export type WhatsappSessionStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ABANDONED'
  | 'EXPIRED';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface WhatsappSession {
  id: string;
  customerPhone: string;
  customerName?: string | null;
  customerEmail?: string | null;
  currentStep: WhatsappConversationStep;
  status: WhatsappSessionStatus;
  orderType?: OrderType | null;
  cartJson?: CartItem[] | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  orderId?: string | null;
  order?: Order | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StartSessionPayload {
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
}

export interface UpdateSessionPayload {
  customerName?: string;
  customerEmail?: string;
  currentStep?: WhatsappConversationStep;
  orderType?: OrderType;
  cartItems?: CartItem[];
  deliveryAddress?: string;
  notes?: string;
}

export interface PaymentAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface CheckoutResponse {
  order: Order;
  paymentAccount: PaymentAccount;
}

export type MenuProduct = Product;
