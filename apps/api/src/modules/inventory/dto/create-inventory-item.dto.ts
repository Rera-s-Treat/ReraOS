import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Jollof Rice (1kg)', description: 'Item name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'SKU-00123',
    description: 'Unique stock keeping unit',
  })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiPropertyOptional({ example: 'Locally sourced parboiled rice' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2500, description: 'Selling price per unit' })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ example: 1800, description: 'Cost price per unit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Initial quantity in stock',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantityInStock?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Quantity threshold that should trigger a reorder',
    default: 0,
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
