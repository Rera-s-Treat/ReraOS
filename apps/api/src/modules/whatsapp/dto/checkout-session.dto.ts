import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class CheckoutSessionDto {
  @ApiPropertyOptional({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description:
      'TRANSFER (default) shows bank details; CASH means the customer pays at the kitchen (pickup/dine-in only)',
    default: PaymentMethod.TRANSFER,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
