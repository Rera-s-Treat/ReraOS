import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CategoriesService } from '../categories/categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  async getProducts() {
    return this.productsRepository.findAll();
  }

  async getProductById(id: string) {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(createProductDto: CreateProductDto, images: string[] = []) {
    if (createProductDto.sku) {
      const existingProduct = await this.productsRepository.findBySku(
        createProductDto.sku,
      );

      if (existingProduct) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    if (createProductDto.categoryId) {
      const exists = await this.categoriesService.categoryExists(
        createProductDto.categoryId,
      );
      if (!exists) {
        throw new BadRequestException('Category not found');
      }
    }

    return this.productsRepository.create({
      name: createProductDto.name,
      sku: createProductDto.sku,
      description: createProductDto.description,
      price: createProductDto.price,
      status: createProductDto.status,
      isAvailable: createProductDto.isAvailable,
      categoryId: createProductDto.categoryId,
      images,
    });
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    const existingProduct = await this.productsRepository.findById(id);

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
      const skuOwner = await this.productsRepository.findBySku(
        updateProductDto.sku,
      );

      if (skuOwner && skuOwner.id !== id) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    if (updateProductDto.categoryId) {
      const exists = await this.categoriesService.categoryExists(
        updateProductDto.categoryId,
      );
      if (!exists) {
        throw new BadRequestException('Category not found');
      }
    }

    return this.productsRepository.update(id, {
      name: updateProductDto.name,
      sku: updateProductDto.sku,
      description: updateProductDto.description,
      price: updateProductDto.price,
      status: updateProductDto.status,
      isAvailable: updateProductDto.isAvailable,
      categoryId: updateProductDto.categoryId,
    });
  }
}
