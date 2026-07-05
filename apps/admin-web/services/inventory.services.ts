import axiosInstance from './axios';
import {
  CreateInventoryItemPayload,
  InventoryItem,
  UpdateInventoryItemPayload,
} from '../types/inventory';

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const response = await axiosInstance.get('/inventory');
  return response.data;
};

export const createInventoryItem = async (
  payload: CreateInventoryItemPayload,
): Promise<InventoryItem> => {
  const response = await axiosInstance.post('/inventory', payload);
  return response.data;
};

export const updateInventoryItem = async (
  id: string,
  payload: UpdateInventoryItemPayload,
): Promise<InventoryItem> => {
  const response = await axiosInstance.patch(`/inventory/${id}`, payload);
  return response.data;
};
