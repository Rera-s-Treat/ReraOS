import { Category } from './category';

export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  price: string;
  status: string;
  isAvailable: boolean;
  categoryId?: string | null;
  category?: Category | null;
  images: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  name: string;
  sku?: string;
  description?: string;
  price: number;
  status?: string;
  isAvailable?: boolean;
  categoryId?: string;
  images?: File[];
}

export interface UpdateProductPayload {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  status?: string;
  isAvailable?: boolean;
  categoryId?: string;
}
