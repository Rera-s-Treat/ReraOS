import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';

const rsvpInclude = { rsvps: { orderBy: { createdAt: 'desc' as const } } };

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvents() {
    return this.prisma.event.findMany({
      include: { _count: { select: { rsvps: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEventById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: rsvpInclude,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async createEvent(dto: CreateEventDto) {
    const existing = await this.prisma.event.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('An event with this slug already exists');
    }

    return this.prisma.event.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        bodyText: dto.bodyText,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        location: dto.location,
        capacity: dto.capacity,
        rsvpOpen: dto.rsvpOpen ?? true,
        status: dto.status ?? EventStatus.DRAFT,
        interestOptions: dto.interestOptions ?? [],
      },
    });
  }

  async updateEvent(id: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (dto.slug && dto.slug !== event.slug) {
      const slugOwner = await this.prisma.event.findUnique({ where: { slug: dto.slug } });
      if (slugOwner) {
        throw new ConflictException('An event with this slug already exists');
      }
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      },
    });
  }

  async updateRsvp(eventId: string, rsvpId: string, dto: UpdateRsvpDto) {
    const rsvp = await this.prisma.eventRsvp.findUnique({ where: { id: rsvpId } });
    if (!rsvp || rsvp.eventId !== eventId) {
      throw new NotFoundException('RSVP not found');
    }

    return this.prisma.eventRsvp.update({
      where: { id: rsvpId },
      data: dto,
    });
  }

  async getPublicEvent(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: { _count: { select: { rsvps: true } } },
    });

    if (!event || event.status !== EventStatus.PUBLISHED) {
      throw new NotFoundException('Event not found');
    }

    return {
      title: event.title,
      slug: event.slug,
      description: event.description,
      bodyText: event.bodyText,
      eventDate: event.eventDate,
      location: event.location,
      rsvpOpen: event.rsvpOpen,
      interestOptions: event.interestOptions,
      capacity: event.capacity,
      spotsTaken: event._count.rsvps,
    };
  }

  async createPublicRsvp(slug: string, dto: CreateRsvpDto) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: { _count: { select: { rsvps: true } } },
    });

    if (!event || event.status !== EventStatus.PUBLISHED) {
      throw new NotFoundException('Event not found');
    }

    if (!event.rsvpOpen) {
      throw new ForbiddenException('RSVPs are closed for this event');
    }

    if (event.capacity && event._count.rsvps >= event.capacity) {
      throw new ForbiddenException('This event is fully booked');
    }

    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Please provide an email or phone number');
    }

    return this.prisma.eventRsvp.create({
      data: {
        eventId: event.id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        numberAttending: dto.numberAttending ?? 1,
        dietaryNote: dto.dietaryNote,
        hearAboutUs: dto.hearAboutUs,
        interests: dto.interests ?? [],
      },
    });
  }
}
