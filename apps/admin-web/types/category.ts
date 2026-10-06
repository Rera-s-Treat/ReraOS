export interface Category {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  isActive?: boolean;
}
