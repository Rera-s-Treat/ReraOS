import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class StartSessionDto {
  @ApiProperty({ example: '+2348012345678' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: 'jane.doe@example.com' })
  @IsOptional()
  @Transform(trim)
  @IsEmail()
  customerEmail?: string;
}
