import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';
import { EventsService } from './events.service';

class InviteCustomersDto {
  @IsArray()
  @IsString({ each: true })
  phones!: string[];
}

@ApiTags('Rera Events')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'List all events' })
  async getEvents() {
    return this.eventsService.getEvents();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get an event with its RSVP responses' })
  async getEventById(@Param('id') id: string) {
    return this.eventsService.getEventById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a new event' })
  async createEvent(@Body() body: CreateEventDto) {
    return this.eventsService.createEvent(body);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update an event (details, capacity, RSVP settings, status)' })
  async updateEvent(@Param('id') id: string, @Body() body: UpdateEventDto) {
    return this.eventsService.updateEvent(id, body);
  }

  @Patch(':id/rsvps/:rsvpId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Update an RSVP (attendance status, feedback)' })
  async updateRsvp(
    @Param('id') id: string,
    @Param('rsvpId') rsvpId: string,
    @Body() body: UpdateRsvpDto,
  ) {
    return this.eventsService.updateRsvp(id, rsvpId, body);
  }

  @Post(':id/invite')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Invite a list of customers (by phone) to this event' })
  async inviteCustomers(@Param('id') id: string, @Body() body: InviteCustomersDto) {
    return this.eventsService.inviteCustomers(id, body.phones);
  }

  @Post(':id/feedback-requests')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Send a feedback request to every ATTENDED RSVP without feedback yet' })
  async sendFeedbackRequests(@Param('id') id: string) {
    return this.eventsService.sendFeedbackRequests(id);
  }
}
