import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { SubmitReviewDto } from './dto/submit-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews (public)')
@Controller('public')
export class ReviewsPublicController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('reviews')
  @ApiOperation({ summary: 'List all published reviews' })
  async getPublicReviews() {
    return this.reviewsService.getPublicReviews();
  }

  @Get('orders/:orderId/review-eligibility')
  @ApiOperation({ summary: "Check whether an order can still be reviewed (for the review form's initial state)" })
  async getReviewEligibility(@Param('orderId') orderId: string) {
    return this.reviewsService.getReviewEligibility(orderId);
  }

  @Post('orders/:orderId/review')
  @ApiOperation({ summary: 'Submit a review for a completed order' })
  async submitReview(@Param('orderId') orderId: string, @Body() body: SubmitReviewDto) {
    return this.reviewsService.submitReview(orderId, body);
  }
}
