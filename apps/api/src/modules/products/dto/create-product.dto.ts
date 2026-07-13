import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Jollof Rice', description: 'Product/menu item name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'SKU-P-00123',
    description: 'Optional stock keeping unit',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 'Smoky party-style jollof rice' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 3500, description: 'Selling price' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
    description: 'Product status',
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product currently appears on the menu',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : value,
  )
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'ID of a category from GET /categories',
    example: 'e3b0c442-98fc-1c14-9afb-4c8996fb9242',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
