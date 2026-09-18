export type ReviewStatus = 'PENDING' | 'PUBLISHED' | 'UNPUBLISHED';

export interface OrderReview {
  id: string;
  orderId: string;
  rating: number;
  comment?: string | null;
  status: ReviewStatus;
  publishedAt: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    customerName: string;
    createdAt: string;
  };
}
