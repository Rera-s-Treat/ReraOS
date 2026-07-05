import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Jane' })
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd', minLength: 8 })
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: '3b1f2e2a-4b1a-4c9a-9c3a-6d6b8f9e0a1b',
    description: 'ID of the role to assign to the user',
    format: 'uuid',
  })
  @IsNotEmpty()
  roleId!: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  phone?: string;
}
