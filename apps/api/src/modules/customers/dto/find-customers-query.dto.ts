import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

export class FindCustomersQueryDto {
  @ApiPropertyOptional({
    example: 'Jane',
    description: 'Matches against customer name or phone number',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['new', 'repeat', 'vip', 'inactive'] })
  @IsOptional()
  @IsIn(['new', 'repeat', 'vip', 'inactive'])
  segment?: 'new' | 'repeat' | 'vip' | 'inactive';

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsISO8601()
  firstOrderFrom?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsISO8601()
  firstOrderTo?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsISO8601()
  lastOrderFrom?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsISO8601()
  lastOrderTo?: string;
}
