import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderType, WhatsappConversationStep } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CartItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateSessionDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: 'jane.doe@example.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({
    enum: WhatsappConversationStep,
    example: WhatsappConversationStep.BROWSING_MENU,
  })
  @IsOptional()
  @IsEnum(WhatsappConversationStep)
  currentStep?: WhatsappConversationStep;

  @ApiPropertyOptional({ enum: OrderType, example: OrderType.DELIVERY })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @ApiPropertyOptional({ type: [CartItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  cartItems?: CartItemDto[];

  @ApiPropertyOptional({ example: '12 Allen Avenue, Ikeja, Lagos' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 'No pepper please' })
  @IsOptional()
  @IsString()
  notes?: string;
}
