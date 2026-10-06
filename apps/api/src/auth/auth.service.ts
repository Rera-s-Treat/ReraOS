import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { RolesService } from '../modules/roles/roles.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { AuthRepository } from './auth.repository';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

const ADMIN_WEB_ORIGIN =
  process.env.ADMIN_WEB_ORIGIN || 'https://rerastreat.com.ng/admin';

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10) as Promise<string>;
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash) as Promise<boolean>;
  }

  async register(registerDto: RegisterPayload) {
    const { email, password, firstName, lastName, phone, roleId } = registerDto;

    const existingUser = await this.authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const roleExists = await this.rolesService.roleExists(roleId);
    if (!roleExists) {
      throw new BadRequestException('Role not found.');
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await this.authRepository.createUser({
      firstName,
      lastName,
      email,
      phone,
      roleId,
      passwordHash: hashedPassword,
    });

    await this.authRepository.logAudit({
      action: AuditAction.CREATE_USER,
      userId: user.id,
      description: 'User account created',
    });

    return {
      message: 'User registered successfully.',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        status: user.status,
        createdAt: user.createdAt,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await this.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    await this.authRepository.logAudit({
      action: AuditAction.LOGIN,
      userId: user.id,
      description: 'User logged in successfully',
    });
    await this.authRepository.updateLastLogin(user.id);

    const accessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role?.name ?? '',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        status: user.status,
      },
    };
  }

  async getMe(authUser: JwtPayload) {
    const user = await this.authRepository.findUserById(authUser.id);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.authRepository.findUserByEmail(
      forgotPasswordDto.email,
    );

    /**
     * Security best practice:
     * do not reveal whether the email exists or not.
     */
    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been generated.',
      };
    }

    const resetToken = crypto.randomUUID();
    const passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.authRepository.setPasswordResetToken(
      user.id,
      resetToken,
      passwordResetExpiresAt,
    );

    const resetLink = `${ADMIN_WEB_ORIGIN}/reset-password?token=${resetToken}`;

    await this.notificationsService.sendEmail(
      user.email,
      'Reset your ReraOS password',
      `Hi ${user.firstName},\n\nSomeone (hopefully you) requested a password reset for your ReraOS admin account.\n\nReset it here: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.\n\nReraOS`,
    );

    return {
      message:
        'If an account with that email exists, a password reset link has been generated.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.authRepository.findUserByPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    const passwordHash = await this.hashPassword(resetPasswordDto.password);

    await this.authRepository.updatePasswordAndClearResetToken(
      user.id,
      passwordHash,
    );

    return {
      message: 'Password reset successful.',
    };
  }

  generateAccessToken(user: {
    id: string;
    email: string;
    roleId: string;
    roleName: string;
  }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
    };

    return this.jwtService.sign(payload);
  }
}
