export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  unitPrice: string;
  costPrice?: string | null;
  quantityInStock: number;
  reorderLevel: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInventoryItemPayload {
  name: string;
  sku: string;
  description?: string;
  unitPrice: number;
  costPrice?: number;
  quantityInStock?: number;
  reorderLevel?: number;
  status?: string;
}

export interface UpdateInventoryItemPayload {
  name?: string;
  sku?: string;
  description?: string;
  unitPrice?: number;
  costPrice?: number;
  quantityInStock?: number;
  reorderLevel?: number;
  status?: string;
}
