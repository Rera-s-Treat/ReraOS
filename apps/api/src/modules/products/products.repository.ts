import { Injectable } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async findBySku(sku: string) {
    return this.prisma.product.findUnique({
      where: { sku },
    });
  }

  async findManyByIds(ids: string[]) {
    return this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
  }

  async findAvailable() {
    return this.prisma.product.findMany({
      where: { status: 'ACTIVE', isAvailable: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: {
    name: string;
    sku?: string;
    description?: string;
    price: number;
    status?: ProductStatus;
    isAvailable?: boolean;
    category?: string;
    images?: string[];
  }) {
    return this.prisma.product.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      sku?: string;
      description?: string;
      price?: number;
      status?: ProductStatus;
      isAvailable?: boolean;
      category?: string;
    },
  ) {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.sku !== undefined ? { sku: data.sku } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.isAvailable !== undefined
          ? { isAvailable: data.isAvailable }
          : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
      },
    });
  }
}
