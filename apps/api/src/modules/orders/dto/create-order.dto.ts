import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderChannel, OrderType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateOrderItemDto {
  @ApiProperty({ example: '3b1f2e2a-4b1a-4c9a-9c3a-6d6b8f9e0a1b' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @ApiPropertyOptional({ example: 'jane.doe@example.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({
    enum: OrderChannel,
    example: OrderChannel.WHATSAPP,
    description: 'Where the order originated from',
  })
  @IsEnum(OrderChannel)
  channel!: OrderChannel;

  @ApiProperty({
    enum: OrderType,
    example: OrderType.DELIVERY,
    description: 'How the order will be fulfilled',
  })
  @IsEnum(OrderType)
  orderType!: OrderType;

  @ApiPropertyOptional({
    example: 'Table 4',
    description: 'Only used for dine-in orders',
  })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiPropertyOptional({
    example: '12 Allen Avenue, Ikeja, Lagos',
    description: 'Only used for delivery orders',
  })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 'No pepper please' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Discount amount applied to the order subtotal',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Line items for the order',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
