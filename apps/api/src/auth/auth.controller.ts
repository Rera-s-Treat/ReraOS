import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthService } from './auth.service';
import {
  LoginResponseDto,
  LogoutResponseDto,
  MeResponseDto,
  RegisterResponseDto,
} from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body(new ValidationPipe()) body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'A user with this email already exists, or the role was not found',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Email a password reset link to the user, if the account exists',
  })
  @ApiOkResponse({
    description:
      'A generic confirmation message, regardless of whether the email matched an account',
  })
  async forgotPassword(@Body(new ValidationPipe()) body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset a user password using a reset token' })
  @ApiOkResponse({
    description: 'Password reset successful',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired reset token',
  })
  async resetPassword(@Body(new ValidationPipe()) body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiOkResponse({
    description: 'Current user retrieved successfully',
    type: MeResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@Req() req: { user: JwtPayload }) {
    return this.authService.getMe(req.user);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Log out the currently authenticated user' })
  @ApiOkResponse({
    description: 'Logout successful',
    type: LogoutResponseDto,
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout() {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
