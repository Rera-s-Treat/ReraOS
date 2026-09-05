import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { JournalService } from './journal.service';

@ApiTags('Journal (public)')
@Controller('public/journal')
export class JournalPublicController {
  constructor(private readonly journalService: JournalService) {}

  @Get()
  @ApiOperation({ summary: 'List all published journal posts' })
  async getPublicPosts() {
    return this.journalService.getPublicPosts();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published journal post by slug' })
  async getPublicPostBySlug(@Param('slug') slug: string) {
    return this.journalService.getPublicPostBySlug(slug);
  }
}
