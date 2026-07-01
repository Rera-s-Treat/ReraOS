import { Injectable } from '@nestjs/common';
import { PrismaClient, User, Prisma } from '@prisma/client';

@Injectable()
export class AuthRepository {
  private prisma = new PrismaClient();

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async createAuditLog(userId: string) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_CREATED',
        description: 'User account created',
      },
    });
  }
}
