import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { InventoryRepository } from '../inventory/inventory.repository';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsRepository } from '../products/products.repository';
import { CreateProductionLogDto } from './dto/create-production-log.dto';

const productionLogInclude = {
  materialsUsed: { include: { inventoryItem: { select: { id: true, name: true, sku: true } } } },
  itemsMade: { include: { product: { select: { id: true, name: true } } } },
  recordedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryRepository: InventoryRepository,
    private readonly inventoryService: InventoryService,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async getProductionLogs() {
    return this.prisma.productionLog.findMany({
      include: productionLogInclude,
      orderBy: { productionDate: 'desc' },
      take: 90,
    });
  }

  async getProductionLogById(id: string) {
    const log = await this.prisma.productionLog.findUnique({
      where: { id },
      include: productionLogInclude,
    });
    if (!log) {
      throw new NotFoundException('Production log not found');
    }
    return log;
  }

  async createProductionLog(dto: CreateProductionLogDto, recordedByUserId?: string) {
    const materialsUsed = dto.materialsUsed ?? [];

    // Validate everything referenced actually exists before writing anything.
    for (const usage of materialsUsed) {
      const item = await this.inventoryRepository.findById(usage.inventoryItemId);
      if (!item) {
        throw new BadRequestException(`Material not found: ${usage.inventoryItemId}`);
      }
    }

    const products = await Promise.all(
      dto.itemsMade.map((entry) => this.productsRepository.findById(entry.productId)),
    );
    const missingProduct = dto.itemsMade.find((_, i) => !products[i]);
    if (missingProduct) {
      throw new BadRequestException(`Product not found: ${missingProduct.productId}`);
    }

    const log = await this.prisma.productionLog.create({
      data: {
        productionDate: new Date(dto.productionDate),
        notes: dto.notes,
        recordedByUserId,
        materialsUsed: {
          create: materialsUsed.map((usage) => ({
            inventoryItemId: usage.inventoryItemId,
            quantityUsed: usage.quantityUsed,
          })),
        },
        itemsMade: {
          create: dto.itemsMade.map((entry) => ({
            productId: entry.productId,
            quantityMade: entry.quantityMade,
          })),
        },
      },
      include: productionLogInclude,
    });

    // Deplete material stock - reuses InventoryService so the existing
    // low-stock/out-of-stock admin notifications keep firing.
    for (const usage of materialsUsed) {
      const item = await this.inventoryRepository.findById(usage.inventoryItemId);
      if (!item) continue;
      const nextQuantity = Math.max(0, item.quantityInStock - usage.quantityUsed);
      await this.inventoryService.updateInventoryItem(usage.inventoryItemId, {
        quantityInStock: nextQuantity,
      });
    }

    // Anything freshly made is, by definition, back in stock.
    for (const entry of dto.itemsMade) {
      const product = await this.productsRepository.findById(entry.productId);
      if (product && !product.isAvailable) {
        await this.productsRepository.update(entry.productId, { isAvailable: true });
      }
    }

    return log;
  }
}
