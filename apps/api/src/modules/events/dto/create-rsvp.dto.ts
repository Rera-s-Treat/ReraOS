import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRsvpDto {
  @ApiProperty({ example: 'Ada Johnson' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'ada@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '08012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numberAttending?: number;

  @ApiPropertyOptional({ example: 'No peanuts please' })
  @IsOptional()
  @IsString()
  dietaryNote?: string;

  @ApiPropertyOptional({ example: 'Instagram' })
  @IsOptional()
  @IsString()
  hearAboutUs?: string;

  @ApiPropertyOptional({
    example: ['Small chops', 'Peppered chicken'],
    description: 'What are you most excited to try?',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
