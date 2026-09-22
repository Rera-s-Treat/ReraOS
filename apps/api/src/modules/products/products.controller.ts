import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { uploadToR2 } from '../../common/r2-storage';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

const MAX_PRODUCT_IMAGES = 3;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const productImagesInterceptor = FilesInterceptor('images', MAX_PRODUCT_IMAGES, {
  storage: memoryStorage(),
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new BadRequestException('Only image files are allowed'), false);
      return;
    }
    callback(null, true);
  },
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
});

@ApiTags('Products')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get all products' })
  async getProducts() {
    return this.productsService.getProducts();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get a product by ID' })
  async getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a new product (with up to 3 images)',
  })
  @UseInterceptors(productImagesInterceptor)
  async createProduct(
    @Body() body: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const images = await Promise.all(
      (files ?? []).map((file) => uploadToR2('products', file)),
    );

    return this.productsService.createProduct(body, images);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a product, optionally replacing its images' })
  @UseInterceptors(productImagesInterceptor)
  async updateProduct(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const images = files?.length
      ? await Promise.all(files.map((file) => uploadToR2('products', file)))
      : undefined;

    return this.productsService.updateProduct(id, body, images);
  }
}
