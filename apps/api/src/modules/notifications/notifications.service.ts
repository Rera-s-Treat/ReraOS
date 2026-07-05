import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { PAYMENT_ACCOUNT } from '../../common/payment-account';

const STAFF_WHATSAPP_NUMBER =
  process.env.STAFF_NOTIFICATION_WHATSAPP_NUMBER || '09124800610';
const STAFF_EMAIL =
  process.env.STAFF_NOTIFICATION_EMAIL || 'rerastreat@gmail.com';

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

function normalizeNigerianPhoneNumber(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  return digits;
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
      process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
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

  async sendWhatsApp(to: string, message: string): Promise<void> {
    if (!this.isWhatsAppConfigured) {
      this.logger.warn(
        `[WhatsApp skipped - no API credentials configured] To: ${to} | Message: ${message}`,
      );
      return;
    }

    try {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const token = process.env.WHATSAPP_API_TOKEN;

      const response = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: normalizeNigerianPhoneNumber(to),
            type: 'text',
            text: { body: message },
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `WhatsApp send to ${to} failed: ${response.status} ${errorBody}`,
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
      await this.sendWhatsApp(
        STAFF_WHATSAPP_NUMBER,
        `New WhatsApp order ${order.orderNumber} from ${order.customerName} (${order.customerPhone}). Items: ${itemsSummary}. Total: ${formatNaira(order.totalAmount)}.`,
      );
    }
  }

  async sendOrderStatusMessage(
    order: NotifiableOrder,
    type: WhatsappMessageType,
    customMessage?: string,
  ): Promise<void> {
    let message: string;

    switch (type) {
      case 'confirmation':
        message = `Hi ${order.customerName}, your order ${order.orderNumber} has been confirmed! We'll let you know as soon as it's ready.`;
        break;
      case 'payment-instruction':
        message = `Hi ${order.customerName}, please pay ${formatNaira(order.totalAmount)} for order ${order.orderNumber} to ${PAYMENT_ACCOUNT.accountName}, ${PAYMENT_ACCOUNT.accountNumber} (${PAYMENT_ACCOUNT.bankName}). Reply once you've made the payment.`;
        break;
      case 'ready':
        message = `Hi ${order.customerName}, your order ${order.orderNumber} is ready!`;
        break;
      case 'update':
        message =
          customMessage ||
          `Hi ${order.customerName}, there's an update on your order ${order.orderNumber}. Please contact us for details.`;
        break;
    }

    await this.sendWhatsApp(order.customerPhone, message);
  }
}
