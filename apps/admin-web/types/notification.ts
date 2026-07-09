export type NotificationCategory = 'ORDER' | 'PAYMENT' | 'INVENTORY' | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: string;
  category: NotificationCategory;
  audience: string;
  channel: string;
  status: string;
  title: string;
  message: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  isRead: boolean;
  orderId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}
