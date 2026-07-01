import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    roleId: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  async createAuditLog(userId: string) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.USER_CREATED,
      },
    });
  }

  async logSuccessfulLogin(userId: string) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.LOGIN,
      },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
      },
    });
  }

  async incrementFailedLogin(email: string) {
    return this.prisma.user.update({
      where: {
        email,
      },
      data: {
        failedLoginAttempts: {
          increment: 1,
        },
      },
    });
  }
}
