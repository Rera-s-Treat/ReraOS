import axiosInstance from './axios';
import { OrderReview, ReviewStatus } from '../types/review';

export const getReviews = async (): Promise<OrderReview[]> => {
  const response = await axiosInstance.get('/reviews');
  return response.data;
};

export const updateReviewStatus = async (
  id: string,
  status: ReviewStatus,
): Promise<OrderReview> => {
  const response = await axiosInstance.patch(`/reviews/${id}/status`, { status });
  return response.data;
};
