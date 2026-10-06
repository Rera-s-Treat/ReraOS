import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CommentStatus,
  JournalStatus,
  NotificationCategory,
  NotificationType,
} from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateJournalPostDto } from './dto/create-journal-post.dto';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import { UpdateCommentStatusDto } from './dto/update-comment-status.dto';
import { UpdateJournalPostDto } from './dto/update-journal-post.dto';

@Injectable()
export class JournalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
    const post = await this.prisma.journalPost.findUnique({
      where: { slug },
      include: {
        _count: { select: { likes: true } },
        comments: {
          where: { status: CommentStatus.PUBLISHED },
          orderBy: { createdAt: 'asc' },
          select: { id: true, authorName: true, body: true, createdAt: true },
        },
      },
    });

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
      likeCount: post._count.likes,
      comments: post.comments,
    };
  }

  // ---------------------------------------------------------------------
  // Likes (public, no auth - deduped per browser via a client-generated id)
  // ---------------------------------------------------------------------

  async toggleLike(slug: string, dto: ToggleLikeDto) {
    const post = await this.prisma.journalPost.findUnique({ where: { slug } });
    if (!post || post.status !== JournalStatus.PUBLISHED) {
      throw new NotFoundException('Journal post not found');
    }

    const existing = await this.prisma.journalLike.findUnique({
      where: { postId_anonymousId: { postId: post.id, anonymousId: dto.anonymousId } },
    });

    if (existing) {
      await this.prisma.journalLike.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.journalLike.create({
        data: { postId: post.id, anonymousId: dto.anonymousId },
      });
    }

    const likeCount = await this.prisma.journalLike.count({ where: { postId: post.id } });
    return { liked: !existing, likeCount };
  }

  // ---------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------

  async submitComment(slug: string, dto: CreateCommentDto) {
    const post = await this.prisma.journalPost.findUnique({ where: { slug } });
    if (!post || post.status !== JournalStatus.PUBLISHED) {
      throw new NotFoundException('Journal post not found');
    }

    const comment = await this.prisma.journalComment.create({
      data: {
        postId: post.id,
        authorName: dto.authorName,
        body: dto.body,
      },
    });

    await this.notificationsService.notifyAdmin({
      type: NotificationType.NEW_JOURNAL_COMMENT,
      category: NotificationCategory.SYSTEM,
      title: `New comment — ${post.title}`,
      message: `${dto.authorName} commented on "${post.title}":\n\n"${dto.body}"\n\nReview it in the dashboard to decide whether to publish it.`,
    });

    return { success: true };
  }

  async getComments() {
    return this.prisma.journalComment.findMany({
      include: { post: { select: { title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCommentStatus(id: string, dto: UpdateCommentStatusDto) {
    const comment = await this.prisma.journalComment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.prisma.journalComment.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async deleteComment(id: string) {
    const comment = await this.prisma.journalComment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    await this.prisma.journalComment.delete({ where: { id } });
    return { success: true };
  }
}
