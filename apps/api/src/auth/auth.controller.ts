import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthService } from './auth.service';

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
  async login(@Body(new ValidationPipe()) body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Logged-in User Profile
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
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
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout() {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
