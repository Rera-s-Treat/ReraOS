import axiosInstance from './axios';
import { CreateProductionLogPayload, ProductionLog } from '../types/production';

export const getProductionLogs = async (): Promise<ProductionLog[]> => {
  const response = await axiosInstance.get('/production');
  return response.data;
};

export const createProductionLog = async (
  payload: CreateProductionLogPayload,
): Promise<ProductionLog> => {
  const response = await axiosInstance.post('/production', payload);
  return response.data;
};
