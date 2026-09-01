import axiosInstance from './axios';
import { Category, CreateCategoryPayload, UpdateCategoryPayload } from '../types/category';

export const getCategories = async (): Promise<Category[]> => {
  const response = await axiosInstance.get('/categories');
  return response.data;
};

export const createCategory = async (name: string): Promise<Category> => {
  const response = await axiosInstance.post('/categories', { name });
  return response.data;
};

export const createCategoryDetailed = async (
  payload: CreateCategoryPayload,
): Promise<Category> => {
  const response = await axiosInstance.post('/categories', payload);
  return response.data;
};

export const updateCategory = async (
  id: string,
  payload: UpdateCategoryPayload,
): Promise<Category> => {
  const response = await axiosInstance.patch(`/categories/${id}`, payload);
  return response.data;
};
