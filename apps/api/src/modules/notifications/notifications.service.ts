import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { normalizeNigerianPhoneNumber } from '../../common/phone';
import { PAYMENT_ACCOUNT } from '../../common/payment-account';

const STAFF_WHATSAPP_NUMBER =
  process.env.STAFF_NOTIFICATION_WHATSAPP_NUMBER || '09124800610';
const STAFF_EMAIL =
  process.env.STAFF_NOTIFICATION_EMAIL || 'rerastreat@gmail.com';

function twilioMessagesUrl(accountSid: string): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
}

export type WhatsappMessageType =
  | 'confirmation'
  | 'payment-instruction'
  | 'ready'
  | 'update';

interface NotifiableOrder {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  channel: string;
  totalAmount: unknown;
  items: Array<{ quantity: number; product: { name: string } }>;
}

interface WhatsappTemplateVariables {
  '1': string;
  '2': string;
  '3': string;
}

function formatNaira(amount: unknown): string {
  return `₦${Number(amount).toLocaleString()}`;
}

function summarizeItems(items: NotifiableOrder['items']): string {
  return items.map((item) => `${item.quantity}× ${item.product.name}`).join(', ');
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private get isEmailConfigured(): boolean {
    return Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
    );
  }

  private get isWhatsAppConfigured(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_WHATSAPP_FROM &&
        process.env.TWILIO_CONTENT_SID,
    );
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    if (!this.isEmailConfigured) {
      this.logger.warn(
        `[Email skipped - no SMTP credentials configured] To: ${to} | Subject: ${subject}\n${text}`,
      );
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error as Error);
    }
  }

  async sendWhatsApp(
    to: string,
    variables: WhatsappTemplateVariables,
  ): Promise<void> {
    if (!this.isWhatsAppConfigured) {
      this.logger.warn(
        `[WhatsApp skipped - no Twilio credentials configured] To: ${to} | Variables: ${JSON.stringify(variables)}`,
      );
      return;
    }

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID!;
      const authToken = process.env.TWILIO_AUTH_TOKEN!;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const body = new URLSearchParams({
        To: `whatsapp:+${normalizeNigerianPhoneNumber(to)}`,
        From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
        ContentSid: process.env.TWILIO_CONTENT_SID!,
        ContentVariables: JSON.stringify(variables),
      });

      const response = await fetch(twilioMessagesUrl(accountSid), {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const responseBody = await response.text();

      if (!response.ok) {
        this.logger.error(
          `WhatsApp send to ${to} failed: ${response.status} ${responseBody}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message to ${to}`, error as Error);
    }
  }

  async notifyNewOrder(order: NotifiableOrder): Promise<void> {
    const itemsSummary = summarizeItems(order.items);

    const emailBody = [
      `New order received: ${order.orderNumber}`,
      `Customer: ${order.customerName} (${order.customerPhone})`,
      `Channel: ${order.channel}`,
      `Items: ${itemsSummary}`,
      `Total: ${formatNaira(order.totalAmount)}`,
    ].join('\n');

    await this.sendEmail(STAFF_EMAIL, `New Order — ${order.orderNumber}`, emailBody);

    if (order.channel === 'WHATSAPP') {
      await this.sendWhatsApp(STAFF_WHATSAPP_NUMBER, {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': `New order! Items: ${itemsSummary}. Total: ${formatNaira(order.totalAmount)}.`,
      });
    }
  }

  async sendOrderStatusMessage(
    order: NotifiableOrder,
    type: WhatsappMessageType,
    customMessage?: string,
  ): Promise<void> {
    let detail: string;

    switch (type) {
      case 'confirmation':
        detail = "Your order has been confirmed! We'll let you know as soon as it's ready.";
        break;
      case 'payment-instruction':
        detail = `Please pay ${formatNaira(order.totalAmount)} to ${PAYMENT_ACCOUNT.accountName}, ${PAYMENT_ACCOUNT.accountNumber} (${PAYMENT_ACCOUNT.bankName}). Reply once you've made the payment.`;
        break;
      case 'ready':
        detail = 'Your order is ready!';
        break;
      case 'update':
        detail = customMessage || "There's an update on your order. Please contact us for details.";
        break;
    }

    await this.sendWhatsApp(order.customerPhone, {
      '1': order.customerName,
      '2': order.orderNumber,
      '3': detail,
    });
  }
}
