import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: "Rera's Treat Preview Tasting" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'preview-tasting', description: 'Used in the public URL' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiPropertyOptional({
    example:
      "You've been following us while we've been getting ready. Now we'd love you to be among the first to taste what we've been working on.",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Longer intro copy shown on the public RSVP page' })
  @IsOptional()
  @IsString()
  bodyText?: string;

  @ApiPropertyOptional({ example: '2026-09-20T15:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ example: 'Ogijo, Ogun State' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  rsvpOpen?: boolean;

  @ApiPropertyOptional({ enum: EventStatus, example: EventStatus.DRAFT })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    example: ['Small chops', 'Yam fries & sauce', 'Peppered beef', 'Peppered chicken', 'Everything!'],
    description: '"What are you most excited to try?" checkbox options for this event',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interestOptions?: string[];
}
