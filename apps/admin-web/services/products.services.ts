import axiosInstance from './axios';
import {
  CreateProductPayload,
  Product,
  UpdateProductPayload,
} from '../types/product';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const getProductImageUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};

export const getProducts = async (): Promise<Product[]> => {
  const response = await axiosInstance.get('/products');
  return response.data;
};

export const createProduct = async (
  payload: CreateProductPayload,
): Promise<Product> => {
  const formData = new FormData();

  formData.append('name', payload.name);
  if (payload.sku) formData.append('sku', payload.sku);
  if (payload.description) formData.append('description', payload.description);
  formData.append('price', String(payload.price));
  if (payload.status) formData.append('status', payload.status);
  if (payload.isAvailable !== undefined) {
    formData.append('isAvailable', String(payload.isAvailable));
  }
  if (payload.category) formData.append('category', payload.category);

  (payload.images ?? []).forEach((file) => {
    formData.append('images', file);
  });

  const response = await axiosInstance.post('/products', formData);
  return response.data;
};

export const updateProduct = async (
  id: string,
  payload: UpdateProductPayload,
): Promise<Product> => {
  const response = await axiosInstance.patch(`/products/${id}`, payload);
  return response.data;
};
