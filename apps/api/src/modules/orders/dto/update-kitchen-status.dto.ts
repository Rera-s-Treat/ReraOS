import { ApiProperty } from '@nestjs/swagger';
import { KitchenStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateKitchenStatusDto {
  @ApiProperty({
    enum: KitchenStatus,
    example: KitchenStatus.PREPARING,
    description: 'New kitchen status for the order',
  })
  @IsEnum(KitchenStatus)
  kitchenStatus!: KitchenStatus;
}
