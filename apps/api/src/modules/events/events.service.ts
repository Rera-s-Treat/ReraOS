import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus, RsvpAttendanceStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma.service';
import { CustomersService } from '../customers/customers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';

const rsvpInclude = { rsvps: { orderBy: { createdAt: 'desc' as const } } };
const PUBLIC_SITE_ORIGIN = 'https://rerastreat.com.ng';
const BREVO_CONTACTS_URL = 'https://api.brevo.com/v3/contacts';

function slugTag(slug: string): string {
  return slug.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function interestTag(interest: string): string {
  return `INTEREST_${interest.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
    const rsvp = await this.prisma.eventRsvp.findUnique({
      where: { id: rsvpId },
      include: { event: true },
    });
    if (!rsvp || rsvp.eventId !== eventId) {
      throw new NotFoundException('RSVP not found');
    }

    const updated = await this.prisma.eventRsvp.update({
      where: { id: rsvpId },
      data: dto,
    });

    if (dto.attendanceStatus === RsvpAttendanceStatus.ATTENDED && rsvp.email) {
      void this.syncBrevoTags(rsvp.email, rsvp.name, [slugTag(`ATTENDED_${rsvp.event.slug}`)]).catch(
        (error) => this.logger.error('Brevo attended-tag sync failed', error as Error),
      );
    }

    return updated;
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

    const rsvp = await this.prisma.eventRsvp.create({
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

    if (dto.email) {
      const tags = [
        slugTag(`EVENT_${event.slug}`),
        ...(dto.interests ?? []).map(interestTag),
      ];
      void this.syncBrevoTags(dto.email, dto.name, tags).catch((error) =>
        this.logger.error('Brevo RSVP-tag sync failed', error as Error),
      );
    }

    return rsvp;
  }

  /**
   * Brevo has no native "tags" concept for contacts - this stores them as a
   * merged, comma-separated custom attribute. Requires a custom text
   * attribute named TAGS to already exist on the Brevo account (Contacts ->
   * Settings -> Contact Attributes); silently no-ops otherwise.
   */
  private async syncBrevoTags(email: string, name: string, newTags: string[]): Promise<void> {
    if (!process.env.BREVO_API_KEY) return;

    const headers = {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    };

    let existingTags: string[] = [];
    try {
      const existingRes = await fetch(`${BREVO_CONTACTS_URL}/${encodeURIComponent(email)}`, {
        headers,
      });
      if (existingRes.ok) {
        const existing = await existingRes.json();
        const raw = existing?.attributes?.TAGS;
        if (typeof raw === 'string' && raw.length > 0) {
          existingTags = raw.split(',').map((t: string) => t.trim());
        }
      }
    } catch (error) {
      this.logger.warn(`Could not read existing Brevo contact for ${email}: ${error}`);
    }

    const mergedTags = Array.from(new Set([...existingTags, ...newTags]));
    const [firstName, ...rest] = name.split(' ');

    const response = await fetch(BREVO_CONTACTS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        updateEnabled: true,
        attributes: {
          FIRSTNAME: firstName,
          LASTNAME: rest.join(' ') || undefined,
          TAGS: mergedTags.join(','),
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Brevo contact sync failed: ${response.status} ${body}`);
    }
  }

  // ---------------------------------------------------------------------
  // Invites
  // ---------------------------------------------------------------------

  async inviteCustomers(eventId: string, phones: string[]) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const eventUrl = `${PUBLIC_SITE_ORIGIN}/events/${event.slug}`;
    const allCustomers = await this.customersService.getCustomers();
    const targets = allCustomers.filter((customer) => phones.includes(customer.phone));

    const results = await Promise.all(
      targets.map(async (customer) => {
        const subject = `You're invited: ${event.title}`;
        const body = `Hi ${customer.displayName},\n\n${
          event.description || "We'd love to have you at our next event."
        }\n\nRSVP here: ${eventUrl}\n\nRera's Treat`;

        try {
          if (customer.email) {
            await this.notificationsService.sendEmail(customer.email, subject, body);
          }
          await this.notificationsService.sendSms(customer.phone, body);
          return { phone: customer.phone, success: true };
        } catch (error) {
          this.logger.error(`Failed to invite ${customer.phone}`, error as Error);
          return { phone: customer.phone, success: false };
        }
      }),
    );

    return { invited: results.filter((r) => r.success).length, total: results.length, results };
  }

  // ---------------------------------------------------------------------
  // Post-event feedback (public, keyed by the RSVP's own unguessable id)
  // ---------------------------------------------------------------------

  async getRsvpForFeedback(rsvpId: string) {
    const rsvp = await this.prisma.eventRsvp.findUnique({
      where: { id: rsvpId },
      include: { event: { select: { title: true } } },
    });

    if (!rsvp) {
      throw new NotFoundException('RSVP not found');
    }

    return {
      name: rsvp.name,
      eventTitle: rsvp.event.title,
      feedback: rsvp.feedback,
      feedbackRating: rsvp.feedbackRating,
    };
  }

  async submitPublicFeedback(rsvpId: string, feedback?: string, feedbackRating?: number) {
    const rsvp = await this.prisma.eventRsvp.findUnique({ where: { id: rsvpId } });
    if (!rsvp) {
      throw new NotFoundException('RSVP not found');
    }

    return this.prisma.eventRsvp.update({
      where: { id: rsvpId },
      data: { feedback, feedbackRating },
    });
  }

  async sendFeedbackRequests(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const attendedRsvps = await this.prisma.eventRsvp.findMany({
      where: { eventId, attendanceStatus: RsvpAttendanceStatus.ATTENDED, feedback: null },
    });

    const results = await Promise.all(
      attendedRsvps.map(async (rsvp) => {
        const feedbackUrl = `${PUBLIC_SITE_ORIGIN}/events/feedback?rsvp=${rsvp.id}`;
        const subject = `How was ${event.title}?`;
        const body = `Hi ${rsvp.name},\n\nThanks for coming to ${event.title}! We'd love to know what you thought:\n\n${feedbackUrl}\n\nRera's Treat`;

        try {
          if (rsvp.email) {
            await this.notificationsService.sendEmail(rsvp.email, subject, body);
          } else if (rsvp.phone) {
            await this.notificationsService.sendSms(rsvp.phone, body);
          }
          return { rsvpId: rsvp.id, success: true };
        } catch (error) {
          this.logger.error(`Failed to send feedback request for ${rsvp.id}`, error as Error);
          return { rsvpId: rsvp.id, success: false };
        }
      }),
    );

    return { sent: results.filter((r) => r.success).length, total: results.length };
  }
}
