import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Staff Login
   * OWNER
   * FRONT_DESK
   * KITCHEN
   */
  @Post('login')
  async login(@Body(new ValidationPipe()) loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Logged-in User Profile
   */
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: { user: unknown }) {
    return req.user;
  }

  /**
   * Logout
   *
   * JWT is stateless, so for MVP we simply
   * return success. The frontend removes
   * the stored access token.
   */
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
