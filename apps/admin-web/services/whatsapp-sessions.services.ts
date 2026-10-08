import axiosInstance from './axios';
import { Product } from '../types/product';
import {
  CheckoutResponse,
  PaymentMethod,
  StartSessionPayload,
  UpdateSessionPayload,
  WhatsappSession,
} from '../types/whatsapp-session';

export const getMenu = async (): Promise<Product[]> => {
  const response = await axiosInstance.get('/whatsapp-sessions/menu');
  return response.data;
};

export const startSession = async (
  payload: StartSessionPayload,
): Promise<WhatsappSession> => {
  const response = await axiosInstance.post('/whatsapp-sessions', payload);
  return response.data;
};

export const getSession = async (id: string): Promise<WhatsappSession> => {
  const response = await axiosInstance.get(`/whatsapp-sessions/${id}`);
  return response.data;
};

export const updateSession = async (
  id: string,
  payload: UpdateSessionPayload,
): Promise<WhatsappSession> => {
  const response = await axiosInstance.patch(
    `/whatsapp-sessions/${id}`,
    payload,
  );
  return response.data;
};

export const checkoutSession = async (
  id: string,
  paymentMethod: PaymentMethod = 'TRANSFER',
): Promise<CheckoutResponse> => {
  const response = await axiosInstance.post(
    `/whatsapp-sessions/${id}/checkout`,
    { paymentMethod },
  );
  return response.data;
};

export const markPaymentPaid = async (id: string) => {
  const response = await axiosInstance.post(
    `/whatsapp-sessions/${id}/mark-paid`,
  );
  return response.data;
};
