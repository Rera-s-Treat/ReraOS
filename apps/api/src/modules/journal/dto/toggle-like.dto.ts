import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ToggleLikeDto {
  @ApiProperty({ example: '3b1f2e2a-4b1a-4c9a-9c3a-6d6b8f9e0a1b', description: 'Client-generated id from localStorage' })
  @IsString()
  @IsNotEmpty()
  anonymousId!: string;
}
