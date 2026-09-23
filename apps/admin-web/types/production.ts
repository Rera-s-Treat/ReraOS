export interface ProductionMaterialUsage {
  id: string;
  quantityUsed: number;
  inventoryItem: { id: string; name: string; sku: string };
}

export interface ProductionItemMade {
  id: string;
  quantityMade: number;
  product: { id: string; name: string };
}

export interface ProductionLog {
  id: string;
  productionDate: string;
  notes?: string | null;
  materialsUsed: ProductionMaterialUsage[];
  itemsMade: ProductionItemMade[];
  recordedBy?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

export interface CreateProductionLogPayload {
  productionDate: string;
  notes?: string;
  materialsUsed: Array<{ inventoryItemId: string; quantityUsed: number }>;
  itemsMade: Array<{ productId: string; quantityMade: number }>;
}
