import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Prefers pickup, allergic to peanuts.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: ['VIP', 'Friend of owner'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
