import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Ada Johnson' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  authorName!: string;

  @ApiProperty({ example: 'This is so helpful, thank you!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  body!: string;
}
