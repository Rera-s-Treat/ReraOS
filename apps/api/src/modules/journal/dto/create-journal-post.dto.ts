import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JournalStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateJournalPostDto {
  @ApiProperty({ example: 'How Many Small Chops for 100 Guests?' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'how-many-small-chops-for-100-guests', description: 'Used in the public URL' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiPropertyOptional({ example: 'A quick guide to portioning small chops for a 100-guest event.' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ example: 'For a party of 100 guests, plan for about...' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ enum: JournalStatus, example: JournalStatus.DRAFT })
  @IsOptional()
  @IsEnum(JournalStatus)
  status?: JournalStatus;
}
