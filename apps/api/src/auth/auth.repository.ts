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

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
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

  async findUserByPasswordResetToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
      },
      include: {
        role: true,
      },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async incrementFailedLoginAttempts(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        failedLoginAttempts: true,
      },
    });

    const failedAttempts = (user?.failedLoginAttempts ?? 0) + 1;
    const shouldLock = failedAttempts >= 5;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: failedAttempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + 15 * 60 * 1000)
          : null,
      },
    });
  }

  async resetFailedLoginAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async revokeRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async addPasswordHistory(userId: string, passwordHash: string) {
    return this.prisma.passwordHistory.create({
      data: {
        userId,
        passwordHash,
      },
    });
  }

  async getPasswordHistory(userId: string) {
    return this.prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  async logAudit(data: {
    action: AuditAction;
    userId?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }

  async setPasswordResetToken(
    userId: string,
    passwordResetToken: string,
    passwordResetExpiresAt: Date,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken,
        passwordResetExpiresAt,
      },
    });
  }

  async updatePasswordAndClearResetToken(
    userId: string,
    passwordHash: string,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }
}