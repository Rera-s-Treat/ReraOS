export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  price: string;
  status: string;
  isAvailable: boolean;
  category?: string | null;
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
  category?: string;
  images?: File[];
}

export interface UpdateProductPayload {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  status?: string;
  isAvailable?: boolean;
  category?: string;
}
