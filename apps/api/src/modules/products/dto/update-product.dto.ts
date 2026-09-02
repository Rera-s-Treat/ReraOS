import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Jollof Rice' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'SKU-P-00123' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 'Smoky party-style jollof rice' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Serves 1-2' })
  @IsOptional()
  @IsString()
  servings?: string;

  @ApiPropertyOptional({
    example: ['2pcs chicken', 'Coleslaw', 'Fries'],
    description: 'What comes with this item, shown as a bullet list',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? [value] : value,
  )
  @IsArray({ message: 'Content must be a list of items, one per line' })
  @IsString({ each: true })
  contents?: string[];

  @ApiPropertyOptional({ example: 3500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product currently appears on the menu',
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Highlight this item on the menu/homepage',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : value,
  )
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Lower numbers show first within a category' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'ID of a category from GET /categories',
    example: 'e3b0c442-98fc-1c14-9afb-4c8996fb9242',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
