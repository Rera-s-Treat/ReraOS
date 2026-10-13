import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendTestSmsDto {
  @ApiProperty({ example: '09081616518' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: "Test message from Rera's Treat" })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;
}
