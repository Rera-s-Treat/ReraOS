import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationCategory, NotificationType, ReviewStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';

const COMPLETED_FULFILLMENT_STATUSES = ['PICKED_UP', 'SERVED', 'DELIVERED'];

/** "Ada Johnson" -> "Ada J." — used wherever a reviewer's name is shown publicly. */
function publicDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const [first, ...rest] = parts;
  const lastInitial = rest[rest.length - 1]?.[0];
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getReviewEligibility(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.review) {
      return {
        orderNumber: order.orderNumber,
        alreadyReviewed: true,
      };
    }

    if (!COMPLETED_FULFILLMENT_STATUSES.includes(order.fulfillmentStatus)) {
      throw new ForbiddenException('This order is not yet completed');
    }

    return {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      alreadyReviewed: false,
    };
  }

  async submitReview(orderId: string, dto: SubmitReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.review) {
      throw new ConflictException('This order has already been reviewed');
    }

    if (!COMPLETED_FULFILLMENT_STATUSES.includes(order.fulfillmentStatus)) {
      throw new BadRequestException('This order is not yet completed');
    }

    const review = await this.prisma.orderReview.create({
      data: {
        orderId: order.id,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    await this.notificationsService.notifyAdmin({
      type: NotificationType.NEW_ORDER_REVIEW,
      category: NotificationCategory.ORDER,
      title: `New Review — ${order.orderNumber} (${dto.rating}★)`,
      message: [
        `${order.customerName} left a ${dto.rating}-star review for order #${order.orderNumber}.`,
        dto.comment ? `"${dto.comment}"` : null,
        'Review it in the dashboard to decide whether to publish it.',
      ]
        .filter(Boolean)
        .join('\n'),
      orderId: order.id,
    });

    return review;
  }

  async getReviews() {
    return this.prisma.orderReview.findMany({
      include: {
        order: {
          select: { orderNumber: true, customerName: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReviewStatus(id: string, dto: UpdateReviewStatusDto) {
    const review = await this.prisma.orderReview.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const becomingPublished =
      dto.status === ReviewStatus.PUBLISHED && review.status !== ReviewStatus.PUBLISHED;

    return this.prisma.orderReview.update({
      where: { id },
      data: {
        status: dto.status,
        publishedAt: becomingPublished ? new Date() : review.publishedAt,
      },
    });
  }

  async getPublicReviews() {
    const reviews = await this.prisma.orderReview.findMany({
      where: { status: ReviewStatus.PUBLISHED },
      include: { order: { select: { customerName: true } } },
      orderBy: { publishedAt: 'desc' },
    });

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customerName: publicDisplayName(review.order.customerName),
      publishedAt: review.publishedAt,
    }));
  }
}
