import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SendWhatsappMessageDto {
  @ApiPropertyOptional({
    example: 'We are sorry, this item is no longer available.',
    description: 'Custom message text (used for update/cancellation notices)',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
