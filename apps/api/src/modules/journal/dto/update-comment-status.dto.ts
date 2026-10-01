import { ApiProperty } from '@nestjs/swagger';
import { CommentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateCommentStatusDto {
  @ApiProperty({ enum: CommentStatus, example: CommentStatus.PUBLISHED })
  @IsEnum(CommentStatus)
  status!: CommentStatus;
}
