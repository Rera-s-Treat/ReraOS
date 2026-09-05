import { ApiPropertyOptional } from '@nestjs/swagger';
import { JournalStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateJournalPostDto {
  @ApiPropertyOptional({ example: 'How Many Small Chops for 100 Guests?' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'how-many-small-chops-for-100-guests' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'A quick guide to portioning small chops for a 100-guest event.' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({ example: 'For a party of 100 guests, plan for about...' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ enum: JournalStatus, example: JournalStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(JournalStatus)
  status?: JournalStatus;
}
