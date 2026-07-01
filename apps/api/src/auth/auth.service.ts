import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthRepository } from './auth.repository';

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
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async register(registerDto: RegisterPayload) {
    const email = registerDto.email;
    const password = registerDto.password;
    const firstName = registerDto.firstName;
    const lastName = registerDto.lastName;
    const phone = registerDto.phone;
    const roleId = registerDto.roleId;

    const existingUser = await this.authRepository.findUserByEmail(email);

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
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

    await this.authRepository.createAuditLog(user.id);

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

    const accessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      roleId: user.roleId,
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

  private generateAccessToken(user: {
    id: string;
    email: string;
    roleId: string;
  }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    return this.jwtService.sign(payload);
  }
}
