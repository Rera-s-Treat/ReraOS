import { Injectable, Logger } from '@nestjs/common';

import { normalizeNigerianPhoneNumber } from '../../common/phone';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommunityMemberDto } from './dto/create-community-member.dto';

function isEmailContact(contact: string): boolean {
  return contact.includes('@');
}

function welcomeEmailBody(name: string): string {
  return `Hi ${name},

You're officially part of the Rera's Treat community — and honestly, that means a lot. This isn't a mailing list, it's the beginning of something we're building together in Ogijo.

Here's what to expect: opening updates, early perks before we launch, and the occasional "help us decide" moment (menu names, specials — your call).

Talk soon,
Rera's Treat`;
}

function welcomeWhatsappMessage(): string {
  return "You're in 🎉 Welcome to the Rera's Treat community! You'll be first to hear about our opening, early perks, and menu decisions. Glad you're building this with us.";
}

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateCommunityMemberDto) {
    const contact = dto.contact.trim();
    const useEmail = isEmailContact(contact);

    const member = await this.prisma.communityMember.create({
      data: {
        name: dto.name.trim(),
        email: useEmail ? contact : null,
        phone: useEmail ? null : normalizeNigerianPhoneNumber(contact),
        town: dto.town,
        menuInterest: dto.menuInterest,
      },
    });

    void this.sendWelcomeMessage(member.id, member.name, useEmail, contact).catch((error) =>
      this.logger.error('Unexpected error sending community welcome message', error as Error),
    );

    return member;
  }

  async findAll() {
    return this.prisma.communityMember.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  private async sendWelcomeMessage(
    id: string,
    name: string,
    useEmail: boolean,
    contact: string,
  ): Promise<void> {
    let error: string | undefined;

    if (useEmail) {
      try {
        await this.notificationsService.sendEmail(
          contact,
          "You're in 🎉",
          welcomeEmailBody(name),
        );
      } catch (err) {
        error = (err as Error).message || String(err);
      }
    } else {
      try {
        await this.notificationsService.sendWhatsApp(contact, {
          '1': name,
          '2': 'Community',
          '3': welcomeWhatsappMessage(),
        });
      } catch (err) {
        error = (err as Error).message || String(err);
      }
    }

    await this.prisma.communityMember.update({
      where: { id },
      data: {
        welcomeSentAt: new Date(),
        welcomeSendError: error,
      },
    });
  }
}
