import { Injectable } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';

const productInclude = { category: true } as const;

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      include: productInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
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

  async findAvailable(categoryId?: string) {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        isAvailable: true,
        ...(categoryId ? { categoryId } : {}),
      },
      include: productInclude,
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
    categoryId?: string;
    images?: string[];
  }) {
    return this.prisma.product.create({
      data,
      include: productInclude,
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
      categoryId?: string;
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
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      },
      include: productInclude,
    });
  }
}
