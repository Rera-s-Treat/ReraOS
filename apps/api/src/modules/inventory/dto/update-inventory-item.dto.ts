import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ example: 'Jollof Rice (1kg)', description: 'Item name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'SKU-00123',
    description: 'Unique stock keeping unit',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 'Locally sourced parboiled rice' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 2500, description: 'Selling price per unit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 1800, description: 'Cost price per unit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 50, description: 'Quantity in stock' })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantityInStock?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Quantity threshold that should trigger a reorder',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({
    enum: InventoryStatus,
    example: InventoryStatus.ACTIVE,
    description: 'Item availability status',
  })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;
}
