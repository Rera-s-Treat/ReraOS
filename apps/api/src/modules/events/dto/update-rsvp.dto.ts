import { ApiPropertyOptional } from '@nestjs/swagger';
import { RsvpAttendanceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateRsvpDto {
  @ApiPropertyOptional({ enum: RsvpAttendanceStatus, example: RsvpAttendanceStatus.ATTENDED })
  @IsOptional()
  @IsEnum(RsvpAttendanceStatus)
  attendanceStatus?: RsvpAttendanceStatus;

  @ApiPropertyOptional({ example: 3, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numberAttending?: number;

  @ApiPropertyOptional({ example: 'Loved the peppered chicken, wants it on the full menu' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  feedbackRating?: number;
}
