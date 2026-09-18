import { ApiPropertyOptional } from '@nestjs/swagger';
import { PayrollStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePayrollEntryDto {
  @ApiPropertyOptional({ example: 80000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ enum: PayrollStatus, example: PayrollStatus.PAID })
  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;

  @ApiPropertyOptional({ example: 'Paid via bank transfer' })
  @IsOptional()
  @IsString()
  notes?: string;
}
