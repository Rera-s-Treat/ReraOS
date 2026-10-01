import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateCommentDto } from './dto/create-comment.dto';
import { ToggleLikeDto } from './dto/toggle-like.dto';
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

  @Post(':slug/like')
  @ApiOperation({ summary: 'Toggle a like on a post (no auth - deduped by a client-generated id)' })
  async toggleLike(@Param('slug') slug: string, @Body() body: ToggleLikeDto) {
    return this.journalService.toggleLike(slug, body);
  }

  @Post(':slug/comments')
  @ApiOperation({ summary: 'Submit a comment on a post (no auth - held for admin review before showing publicly)' })
  async submitComment(@Param('slug') slug: string, @Body() body: CreateCommentDto) {
    return this.journalService.submitComment(slug, body);
  }
}
