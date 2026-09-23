import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class MaterialUsageDto {
  @ApiProperty({ example: '3b1f2e2a-4b1a-4c9a-9c3a-6d6b8f9e0a1b' })
  @IsUUID()
  inventoryItemId!: string;

  @ApiProperty({ example: 5, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantityUsed!: number;
}

class ItemMadeDto {
  @ApiProperty({ example: '3b1f2e2a-4b1a-4c9a-9c3a-6d6b8f9e0a1b' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 10, minimum: 1, description: 'e.g. 10 pouches made' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantityMade!: number;
}

export class CreateProductionLogDto {
  @ApiProperty({ example: '2026-09-23' })
  @IsDateString()
  productionDate!: string;

  @ApiPropertyOptional({ example: 'Ran low on vegetable oil, topped up mid-shift' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [MaterialUsageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialUsageDto)
  materialsUsed?: MaterialUsageDto[];

  @ApiProperty({ type: [ItemMadeDto], description: 'What was produced today' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Record at least one item made' })
  @ValidateNested({ each: true })
  @Type(() => ItemMadeDto)
  itemsMade!: ItemMadeDto[];
}
