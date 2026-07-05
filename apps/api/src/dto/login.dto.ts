import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd', minLength: 8 })
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, {
    message: 'Password must be at least 8 characters.',
  })
  password!: string;
}
