import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

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

    return this.inventoryRepository.update(id, {
      name: updateInventoryItemDto.name,
      sku: updateInventoryItemDto.sku,
      description: updateInventoryItemDto.description,
      unitPrice: updateInventoryItemDto.unitPrice,
      costPrice: updateInventoryItemDto.costPrice,
      quantityInStock: updateInventoryItemDto.quantityInStock,
      reorderLevel: updateInventoryItemDto.reorderLevel,
      status: updateInventoryItemDto.status,
    });
  }
}
