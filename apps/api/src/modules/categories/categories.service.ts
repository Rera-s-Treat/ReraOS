import { ConflictException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async categoryExists(id: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    return Boolean(category);
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('A category with this name already exists');
    }

    return this.prisma.category.create({ data: { name: dto.name } });
  }
}
