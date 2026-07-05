import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

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

    return this.productsRepository.create({
      name: createProductDto.name,
      sku: createProductDto.sku,
      description: createProductDto.description,
      price: createProductDto.price,
      status: createProductDto.status,
      isAvailable: createProductDto.isAvailable,
      category: createProductDto.category,
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

    return this.productsRepository.update(id, {
      name: updateProductDto.name,
      sku: updateProductDto.sku,
      description: updateProductDto.description,
      price: updateProductDto.price,
      status: updateProductDto.status,
      isAvailable: updateProductDto.isAvailable,
      category: updateProductDto.category,
    });
  }
}
