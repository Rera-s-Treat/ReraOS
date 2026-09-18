import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePayrollEntryDto {
  @ApiProperty({ example: '3b1f2e2a-4b1a-4c9a-9c3a-6d6b8f9e0a1b' })
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ example: 'September 2026' })
  @IsString()
  @IsNotEmpty()
  periodLabel!: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  periodStart!: string;

  @ApiProperty({ example: '2026-09-30' })
  @IsDateString()
  periodEnd!: string;

  @ApiProperty({ example: 80000, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: 'Prorated for 3 days off' })
  @IsOptional()
  @IsString()
  notes?: string;
}
