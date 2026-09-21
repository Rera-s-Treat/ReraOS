import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Ada Johnson' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiPropertyOptional({ example: 'Kitchen Assistant' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: '08012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 80000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlySalary?: number;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 31, description: 'Day of birthday (no year)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  birthdayDay?: number;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 12, description: 'Month of birthday (no year)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  birthdayMonth?: number;

  @ApiPropertyOptional({ example: '12 Allen Avenue, Ogijo, Ogun State' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'HND Food Science, Ogun State Polytechnic' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ example: 'Allergic to shellfish' })
  @IsOptional()
  @IsString()
  allergy?: string;

  @ApiPropertyOptional({ example: 'GTBank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'Ada Johnson' })
  @IsOptional()
  @IsString()
  bankAccountName?: string;
}
