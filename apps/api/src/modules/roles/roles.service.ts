import { Injectable } from '@nestjs/common';
import { RolesRepository } from './roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async getRoles() {
    return this.rolesRepository.findAll();
  }

  async roleExists(id: string): Promise<boolean> {
    const role = await this.rolesRepository.findById(id);
    return role !== null;
  }
}
