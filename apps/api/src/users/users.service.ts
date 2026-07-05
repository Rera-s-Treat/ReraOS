import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RolesService } from '../modules/roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rolesService: RolesService,
  ) {}

  async getUsers() {
    return this.usersRepository.findAllUsers();
  }

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findUserByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const roleExists = await this.rolesService.roleExists(createUserDto.roleId);
    if (!roleExists) {
      throw new BadRequestException('Role not found');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    return this.usersRepository.createUser({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      passwordHash,
      roleId: createUserDto.roleId,
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.usersRepository.findUserById(id);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailOwner = await this.usersRepository.findUserByEmail(
        updateUserDto.email,
      );

      if (emailOwner && emailOwner.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (updateUserDto.roleId && updateUserDto.roleId !== existingUser.roleId) {
      const roleExists = await this.rolesService.roleExists(updateUserDto.roleId);

      if (!roleExists) {
        throw new BadRequestException('Role not found');
      }
    }

    return this.usersRepository.updateUser(id, {
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      email: updateUserDto.email,
      phone: updateUserDto.phone,
      roleId: updateUserDto.roleId,
      status: updateUserDto.status,
    });
  }
}
