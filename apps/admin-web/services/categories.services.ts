import axiosInstance from './axios';
import { Category } from '../types/category';

export const getCategories = async (): Promise<Category[]> => {
  const response = await axiosInstance.get('/categories');
  return response.data;
};

export const createCategory = async (name: string): Promise<Category> => {
  const response = await axiosInstance.post('/categories', { name });
  return response.data;
};
