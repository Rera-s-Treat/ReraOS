import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { EventsService } from './events.service';

@ApiTags('Rera Events (public)')
@Controller('public/events')
export class EventsPublicController {
  constructor(private readonly eventsService: EventsService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published event by slug, for the public RSVP page' })
  async getPublicEvent(@Param('slug') slug: string) {
    return this.eventsService.getPublicEvent(slug);
  }

  @Post(':slug/rsvp')
  @ApiOperation({ summary: 'Submit an RSVP for a published event' })
  async createRsvp(@Param('slug') slug: string, @Body() body: CreateRsvpDto) {
    return this.eventsService.createPublicRsvp(slug, body);
  }

  @Get('rsvp/:rsvpId')
  @ApiOperation({ summary: 'Get minimal RSVP + event info for the public feedback page' })
  async getRsvpForFeedback(@Param('rsvpId') rsvpId: string) {
    return this.eventsService.getRsvpForFeedback(rsvpId);
  }

  @Patch('rsvp/:rsvpId/feedback')
  @ApiOperation({ summary: 'Submit post-event feedback for an RSVP' })
  async submitFeedback(@Param('rsvpId') rsvpId: string, @Body() body: SubmitFeedbackDto) {
    return this.eventsService.submitPublicFeedback(rsvpId, body.feedback, body.feedbackRating);
  }
}
