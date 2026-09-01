import axiosInstance from './axios';
import {
  CreateOrderPayload,
  FulfillmentStatus,
  KitchenStatus,
  Order,
  OrderAuditLogEntry,
  OrderFilters,
  PaymentStatus,
} from '../types/order';

export const getOrders = async (filters?: OrderFilters): Promise<Order[]> => {
  const response = await axiosInstance.get('/orders', { params: filters });
  return response.data;
};

export const getOrderById = async (id: string): Promise<Order> => {
  const response = await axiosInstance.get(`/orders/${id}`);
  return response.data;
};

export const getOrderAuditLog = async (
  id: string,
): Promise<OrderAuditLogEntry[]> => {
  const response = await axiosInstance.get(`/orders/${id}/audit-log`);
  return response.data;
};

export const createOrder = async (
  payload: CreateOrderPayload,
): Promise<Order> => {
  const response = await axiosInstance.post('/orders', payload);
  return response.data;
};

export const updatePaymentStatus = async (
  id: string,
  paymentStatus: PaymentStatus,
): Promise<Order> => {
  const response = await axiosInstance.patch(`/orders/${id}/payment-status`, {
    paymentStatus,
  });
  return response.data;
};

export const updateKitchenStatus = async (
  id: string,
  kitchenStatus: KitchenStatus,
): Promise<Order> => {
  const response = await axiosInstance.patch(`/orders/${id}/kitchen-status`, {
    kitchenStatus,
  });
  return response.data;
};

export const updateFulfillmentStatus = async (
  id: string,
  fulfillmentStatus: FulfillmentStatus,
): Promise<Order> => {
  const response = await axiosInstance.patch(
    `/orders/${id}/fulfillment-status`,
    { fulfillmentStatus },
  );
  return response.data;
};

export const sendOrderConfirmation = async (
  id: string,
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post(
    `/orders/${id}/notify/confirmation`,
  );
  return response.data;
};

export const sendOrderPaymentInstruction = async (
  id: string,
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post(
    `/orders/${id}/notify/payment-instruction`,
  );
  return response.data;
};

export const sendOrderReady = async (
  id: string,
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post(`/orders/${id}/notify/ready`);
  return response.data;
};

export const sendOrderUpdate = async (
  id: string,
  message?: string,
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post(`/orders/${id}/notify/update`, {
    message,
  });
  return response.data;
};
