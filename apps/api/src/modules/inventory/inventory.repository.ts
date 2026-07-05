import { Injectable } from '@nestjs/common';
import { InventoryStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.inventoryItem.findUnique({
      where: { id },
    });
  }

  async findBySku(sku: string) {
    return this.prisma.inventoryItem.findUnique({
      where: { sku },
    });
  }

  async create(data: {
    name: string;
    sku: string;
    description?: string;
    unitPrice: number;
    costPrice?: number;
    quantityInStock?: number;
    reorderLevel?: number;
    status?: InventoryStatus;
  }) {
    return this.prisma.inventoryItem.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      sku?: string;
      description?: string;
      unitPrice?: number;
      costPrice?: number;
      quantityInStock?: number;
      reorderLevel?: number;
      status?: InventoryStatus;
    },
  ) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.sku !== undefined ? { sku: data.sku } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.unitPrice !== undefined
          ? { unitPrice: data.unitPrice }
          : {}),
        ...(data.costPrice !== undefined
          ? { costPrice: data.costPrice }
          : {}),
        ...(data.quantityInStock !== undefined
          ? { quantityInStock: data.quantityInStock }
          : {}),
        ...(data.reorderLevel !== undefined
          ? { reorderLevel: data.reorderLevel }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
  }
}
