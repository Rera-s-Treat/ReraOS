import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationCategory, NotificationType } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getInventoryItems() {
    return this.inventoryRepository.findAll();
  }

  async getInventoryItemById(id: string) {
    const item = await this.inventoryRepository.findById(id);

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }

  async createInventoryItem(createInventoryItemDto: CreateInventoryItemDto) {
    const existingItem = await this.inventoryRepository.findBySku(
      createInventoryItemDto.sku,
    );

    if (existingItem) {
      throw new ConflictException(
        'Inventory item with this SKU already exists',
      );
    }

    return this.inventoryRepository.create({
      name: createInventoryItemDto.name,
      sku: createInventoryItemDto.sku,
      description: createInventoryItemDto.description,
      unitPrice: createInventoryItemDto.unitPrice,
      costPrice: createInventoryItemDto.costPrice,
      quantityInStock: createInventoryItemDto.quantityInStock,
      reorderLevel: createInventoryItemDto.reorderLevel,
      status: createInventoryItemDto.status,
    });
  }

  async updateInventoryItem(
    id: string,
    updateInventoryItemDto: UpdateInventoryItemDto,
  ) {
    const existingItem = await this.inventoryRepository.findById(id);

    if (!existingItem) {
      throw new NotFoundException('Inventory item not found');
    }

    if (
      updateInventoryItemDto.sku &&
      updateInventoryItemDto.sku !== existingItem.sku
    ) {
      const skuOwner = await this.inventoryRepository.findBySku(
        updateInventoryItemDto.sku,
      );

      if (skuOwner && skuOwner.id !== id) {
        throw new ConflictException(
          'Inventory item with this SKU already exists',
        );
      }
    }

    const updatedItem = await this.inventoryRepository.update(id, {
      name: updateInventoryItemDto.name,
      sku: updateInventoryItemDto.sku,
      description: updateInventoryItemDto.description,
      unitPrice: updateInventoryItemDto.unitPrice,
      costPrice: updateInventoryItemDto.costPrice,
      quantityInStock: updateInventoryItemDto.quantityInStock,
      reorderLevel: updateInventoryItemDto.reorderLevel,
      status: updateInventoryItemDto.status,
    });

    await this.notifyOnStockCrossing(existingItem, updatedItem);

    return updatedItem;
  }

  private async notifyOnStockCrossing(
    before: { quantityInStock: number; reorderLevel: number },
    after: { id: string; name: string; sku: string; quantityInStock: number; reorderLevel: number },
  ): Promise<void> {
    const wasOutOfStock = before.quantityInStock <= 0;
    const isOutOfStock = after.quantityInStock <= 0;
    const wasLowStock = before.quantityInStock > 0 && before.quantityInStock <= before.reorderLevel;
    const isLowStock = after.quantityInStock > 0 && after.quantityInStock <= after.reorderLevel;

    if (isOutOfStock && !wasOutOfStock) {
      await this.notificationsService.notifyAdmin({
        type: NotificationType.PRODUCT_OUT_OF_STOCK,
        category: NotificationCategory.INVENTORY,
        title: `Out of Stock — ${after.name}`,
        message: `${after.name} (SKU: ${after.sku}) is now out of stock.`,
      });
    } else if (isLowStock && !wasLowStock) {
      await this.notificationsService.notifyAdmin({
        type: NotificationType.PRODUCT_LOW_STOCK,
        category: NotificationCategory.INVENTORY,
        title: `Low Stock — ${after.name}`,
        message: `${after.name} (SKU: ${after.sku}) is low on stock: ${after.quantityInStock} left (reorder level: ${after.reorderLevel}).`,
      });
    }
  }
}
