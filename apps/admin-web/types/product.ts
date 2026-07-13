export type ProductCategory =
  | 'PACKS'
  | 'PLATTERS'
  | 'WHOLE_MEALS'
  | 'SPECIALS'
  | 'DRINKS';

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  PACKS: 'Packs',
  PLATTERS: 'Platters',
  WHOLE_MEALS: 'Whole Meals',
  SPECIALS: 'Specials',
  DRINKS: 'Drinks',
};

export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  price: string;
  status: string;
  isAvailable: boolean;
  category?: ProductCategory | null;
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
  category?: ProductCategory;
  images?: File[];
}

export interface UpdateProductPayload {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  status?: string;
  isAvailable?: boolean;
  category?: ProductCategory;
}
