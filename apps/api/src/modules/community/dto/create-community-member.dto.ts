import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityMenuInterest, CommunityTown } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommunityMemberDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: '+2348012345678',
    description: 'A phone number (WhatsApp) or an email address — whichever the signer prefers',
  })
  @IsString()
  @IsNotEmpty()
  contact!: string;

  @ApiProperty({ enum: CommunityTown, example: CommunityTown.OGIJO })
  @IsEnum(CommunityTown)
  town!: CommunityTown;

  @ApiPropertyOptional({ enum: CommunityMenuInterest, example: CommunityMenuInterest.SMALL_CHOPS })
  @IsOptional()
  @IsEnum(CommunityMenuInterest)
  menuInterest?: CommunityMenuInterest;
}
