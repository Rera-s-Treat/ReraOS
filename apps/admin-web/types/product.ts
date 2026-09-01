import { Category } from './category';

export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  servings?: string | null;
  contents: string[];
  price: string;
  status: string;
  isAvailable: boolean;
  featured: boolean;
  sortOrder: number;
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
  servings?: string;
  contents?: string[];
  price: number;
  status?: string;
  isAvailable?: boolean;
  featured?: boolean;
  sortOrder?: number;
  categoryId?: string;
  images?: File[];
}

export interface UpdateProductPayload {
  name?: string;
  sku?: string;
  description?: string;
  servings?: string;
  contents?: string[];
  price?: number;
  status?: string;
  isAvailable?: boolean;
  featured?: boolean;
  sortOrder?: number;
  categoryId?: string;
}
