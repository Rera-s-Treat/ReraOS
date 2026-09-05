import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JournalStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';
import { CreateJournalPostDto } from './dto/create-journal-post.dto';
import { UpdateJournalPostDto } from './dto/update-journal-post.dto';

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  async getPosts() {
    return this.prisma.journalPost.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getPostById(id: string) {
    const post = await this.prisma.journalPost.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Journal post not found');
    }
    return post;
  }

  async createPost(dto: CreateJournalPostDto, coverImage?: string) {
    const existing = await this.prisma.journalPost.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('A journal post with this slug already exists');
    }

    const status = dto.status ?? JournalStatus.DRAFT;

    return this.prisma.journalPost.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        body: dto.body,
        coverImage,
        status,
        publishedAt: status === JournalStatus.PUBLISHED ? new Date() : undefined,
      },
    });
  }

  async updatePost(id: string, dto: UpdateJournalPostDto, coverImage?: string) {
    const post = await this.prisma.journalPost.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Journal post not found');
    }

    if (dto.slug && dto.slug !== post.slug) {
      const slugOwner = await this.prisma.journalPost.findUnique({ where: { slug: dto.slug } });
      if (slugOwner) {
        throw new ConflictException('A journal post with this slug already exists');
      }
    }

    const becomingPublished =
      dto.status === JournalStatus.PUBLISHED && post.status !== JournalStatus.PUBLISHED;

    const { removeCoverImage, ...rest } = dto;
    const nextCoverImage = coverImage ?? (removeCoverImage ? null : undefined);

    return this.prisma.journalPost.update({
      where: { id },
      data: {
        ...rest,
        coverImage: nextCoverImage,
        publishedAt: becomingPublished ? new Date() : undefined,
      },
    });
  }

  async deletePost(id: string) {
    const post = await this.prisma.journalPost.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Journal post not found');
    }
    await this.prisma.journalPost.delete({ where: { id } });
    return { success: true };
  }

  async getPublicPosts() {
    const posts = await this.prisma.journalPost.findMany({
      where: { status: JournalStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
    });

    return posts.map((post) => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
    }));
  }

  async getPublicPostBySlug(slug: string) {
    const post = await this.prisma.journalPost.findUnique({ where: { slug } });

    if (!post || post.status !== JournalStatus.PUBLISHED) {
      throw new NotFoundException('Journal post not found');
    }

    return {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body: post.body,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
    };
  }
}
