import axiosInstance from './axios';
import {
  ActionQueue,
  AllTimeOverview,
  DashboardOverview,
  InventoryAlerts,
  MonthlyAnalytics,
  OrderStatusSummary,
  SalesTrendPoint,
  TopProduct,
} from '../types/dashboard';

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await axiosInstance.get('/dashboard/overview');
  return response.data;
};

export const getSalesTrend = async (
  days: 7 | 30,
): Promise<SalesTrendPoint[]> => {
  const response = await axiosInstance.get('/dashboard/sales-trend', {
    params: { days },
  });
  return response.data;
};

export const getOrderStatusSummary = async (): Promise<OrderStatusSummary> => {
  const response = await axiosInstance.get('/dashboard/order-status-summary');
  return response.data;
};

export const getTopProducts = async (
  days: 7 | 30,
  by: 'quantity' | 'revenue',
  limit = 5,
): Promise<TopProduct[]> => {
  const response = await axiosInstance.get('/dashboard/top-products', {
    params: { days, by, limit },
  });
  return response.data;
};

export const getInventoryAlerts = async (): Promise<InventoryAlerts> => {
  const response = await axiosInstance.get('/dashboard/inventory-alerts');
  return response.data;
};

export const getActionQueue = async (): Promise<ActionQueue> => {
  const response = await axiosInstance.get('/dashboard/action-queue');
  return response.data;
};

export const getAllTimeOverview = async (): Promise<AllTimeOverview> => {
  const response = await axiosInstance.get('/dashboard/analytics/all-time');
  return response.data;
};

export const getMonthlyAnalytics = async (): Promise<MonthlyAnalytics[]> => {
  const response = await axiosInstance.get('/dashboard/analytics/monthly');
  return response.data;
};
