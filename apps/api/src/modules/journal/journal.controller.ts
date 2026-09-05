import { extname } from 'path';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CreateJournalPostDto } from './dto/create-journal-post.dto';
import { UpdateJournalPostDto } from './dto/update-journal-post.dto';
import { JournalService } from './journal.service';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const coverImageInterceptor = FileInterceptor('coverImage', {
  storage: diskStorage({
    destination: './uploads/journal',
    filename: (_req, file, callback) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
});

@ApiTags('Journal')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'List all journal posts (any status)' })
  async getPosts() {
    return this.journalService.getPosts();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get a journal post by ID' })
  async getPostById(@Param('id') id: string) {
    return this.journalService.getPostById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new journal post, optionally with a cover photo' })
  @UseInterceptors(coverImageInterceptor)
  async createPost(
    @Body() body: CreateJournalPostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const coverImage = file ? `/uploads/journal/${file.filename}` : undefined;
    return this.journalService.createPost(body, coverImage);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a journal post, optionally replacing the cover photo' })
  @UseInterceptors(coverImageInterceptor)
  async updatePost(
    @Param('id') id: string,
    @Body() body: UpdateJournalPostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const coverImage = file ? `/uploads/journal/${file.filename}` : undefined;
    return this.journalService.updatePost(id, body, coverImage);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete a journal post' })
  async deletePost(@Param('id') id: string) {
    return this.journalService.deletePost(id);
  }
}
