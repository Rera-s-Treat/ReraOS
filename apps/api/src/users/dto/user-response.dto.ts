import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserRoleResponseDto {
  @ApiProperty({ example: '3b1f2e2a-4b1a-4c9a-9c3a-6d6b8f9e0a1b' })
  id!: string;

  @ApiProperty({ example: 'ADMIN' })
  name!: string;

  @ApiPropertyOptional({
    example: 'Full administrative access',
    nullable: true,
  })
  description!: string | null;
}

export class UserResponseDto {
  @ApiProperty({ example: '3b1f2e2a-4b1a-4c9a-9c3a-6d6b8f9e0a1b' })
  id!: string;

  @ApiProperty({ example: 'Jane' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: '+15551234567', nullable: true })
  phone!: string | null;

  @ApiProperty({
    example: '3b1f2e2a-4b1a-4c9a-9c3a-6d6b8f9e0a1b',
    format: 'uuid',
  })
  roleId!: string;

  @ApiProperty({
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    example: 'ACTIVE',
  })
  status!: string;

  @ApiProperty({ example: '2026-07-01T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-01T12:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ type: UserRoleResponseDto })
  role!: UserRoleResponseDto;
}
