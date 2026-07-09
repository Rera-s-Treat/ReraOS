import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationAudience,
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationType,
} from '@prisma/client';
import * as nodemailer from 'nodemailer';

import { normalizeNigerianPhoneNumber } from '../../common/phone';
import { PAYMENT_ACCOUNT } from '../../common/payment-account';
import { PrismaService } from '../../common/prisma.service';

const STAFF_EMAIL = process.env.STAFF_NOTIFICATION_EMAIL || 'rerastreat@gmail.com';
const ADMIN_CC_EMAIL =
  process.env.ADMIN_NOTIFICATION_CC_EMAIL || 'adeeyotemitope5@gmail.com';
const STAFF_WHATSAPP_NUMBER =
  process.env.STAFF_NOTIFICATION_WHATSAPP_NUMBER || '09124800610';

function twilioMessagesUrl(accountSid: string): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
}

export type WhatsappMessageType =
  | 'confirmation'
  | 'payment-instruction'
  | 'ready'
  | 'update';

interface NotifiableOrder {
  id?: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  channel: string;
  orderType?: string;
  totalAmount: unknown;
  items: Array<{ quantity: number; product: { name: string } }>;
}

interface WhatsappTemplateVariables {
  '1': string;
  '2': string;
  '3': string;
}

interface DispatchAdminPayload {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  orderId?: string;
}

interface DispatchCustomerPayload {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  orderId?: string;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  whatsappVariables: WhatsappTemplateVariables;
}

function formatNaira(amount: unknown): string {
  return `₦${Number(amount).toLocaleString()}`;
}

function summarizeItems(items: NotifiableOrder['items']): string {
  return items.map((item) => `${item.quantity}× ${item.product.name}`).join(', ');
}

function readyMessageForOrderType(orderType?: string): string {
  if (orderType === 'DELIVERY') return 'Your order is out for delivery!';
  if (orderType === 'PICKUP') return 'Your order is ready for pickup!';
  return 'Your order is ready to be served!';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  private async sendEmailRaw(
    to: string,
    subject: string,
    text: string,
    cc?: string,
  ): Promise<boolean> {
    if (!this.isEmailConfigured) {
      this.logger.warn(
        `[Email skipped - no SMTP credentials configured] To: ${to} | Subject: ${subject}\n${text}`,
      );
      return false;
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
        cc,
        subject,
        text,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error as Error);
      return false;
    }
  }

  private async sendWhatsAppRaw(
    to: string,
    variables: WhatsappTemplateVariables,
  ): Promise<boolean> {
    if (!this.isWhatsAppConfigured) {
      this.logger.warn(
        `[WhatsApp skipped - no Twilio credentials configured] To: ${to} | Variables: ${JSON.stringify(variables)}`,
      );
      return false;
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
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message to ${to}`, error as Error);
      return false;
    }
  }

  /** Public low-level senders, kept for direct/manual use (e.g. admin-triggered custom messages). */
  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    await this.sendEmailRaw(to, subject, text);
  }

  async sendWhatsApp(to: string, variables: WhatsappTemplateVariables): Promise<void> {
    await this.sendWhatsAppRaw(to, variables);
  }

  /** Fires an admin-facing notification: persisted for the in-app feed, and emailed to staff + cc. */
  async notifyAdmin(payload: DispatchAdminPayload): Promise<void> {
    await this.prisma.notification.create({
      data: {
        type: payload.type,
        category: payload.category,
        audience: NotificationAudience.ADMIN,
        channel: NotificationChannel.IN_APP,
        status: NotificationDeliveryStatus.SENT,
        title: payload.title,
        message: payload.message,
        orderId: payload.orderId,
      },
    });

    const emailSent = await this.sendEmailRaw(
      STAFF_EMAIL,
      payload.title,
      payload.message,
      ADMIN_CC_EMAIL,
    );

    await this.prisma.notification.create({
      data: {
        type: payload.type,
        category: payload.category,
        audience: NotificationAudience.ADMIN,
        channel: NotificationChannel.EMAIL,
        status: emailSent
          ? NotificationDeliveryStatus.SENT
          : NotificationDeliveryStatus.SKIPPED,
        title: payload.title,
        message: payload.message,
        recipientEmail: STAFF_EMAIL,
        orderId: payload.orderId,
      },
    });

    if (!emailSent) {
      await this.recordDeliveryFailure(
        `Admin email notification (${payload.type}) was not sent — SMTP not configured or send failed.`,
        payload.orderId,
      );
    }
  }

  /** Fires a customer-facing notification via WhatsApp and/or email, whichever contact info is available. */
  async notifyCustomer(payload: DispatchCustomerPayload): Promise<void> {
    if (payload.recipientPhone) {
      const sent = await this.sendWhatsAppRaw(
        payload.recipientPhone,
        payload.whatsappVariables,
      );

      await this.prisma.notification.create({
        data: {
          type: payload.type,
          category: payload.category,
          audience: NotificationAudience.CUSTOMER,
          channel: NotificationChannel.WHATSAPP,
          status: sent
            ? NotificationDeliveryStatus.SENT
            : NotificationDeliveryStatus.SKIPPED,
          title: payload.title,
          message: payload.message,
          recipientPhone: payload.recipientPhone,
          orderId: payload.orderId,
        },
      });

      if (!sent) {
        await this.recordDeliveryFailure(
          `Customer WhatsApp notification (${payload.type}) to ${payload.recipientPhone} was not sent — Twilio not configured or send failed.`,
          payload.orderId,
        );
      }
    }

    if (payload.recipientEmail) {
      const sent = await this.sendEmailRaw(
        payload.recipientEmail,
        payload.title,
        payload.message,
      );

      await this.prisma.notification.create({
        data: {
          type: payload.type,
          category: payload.category,
          audience: NotificationAudience.CUSTOMER,
          channel: NotificationChannel.EMAIL,
          status: sent
            ? NotificationDeliveryStatus.SENT
            : NotificationDeliveryStatus.SKIPPED,
          title: payload.title,
          message: payload.message,
          recipientEmail: payload.recipientEmail,
          orderId: payload.orderId,
        },
      });
    }
  }

  private async recordDeliveryFailure(message: string, orderId?: string): Promise<void> {
    await this.prisma.notification.create({
      data: {
        type: NotificationType.NOTIFICATION_DELIVERY_FAILURE,
        category: NotificationCategory.SYSTEM,
        audience: NotificationAudience.ADMIN,
        channel: NotificationChannel.IN_APP,
        status: NotificationDeliveryStatus.SENT,
        title: 'Notification delivery failure',
        message,
        orderId,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Order lifecycle
  // ---------------------------------------------------------------------

  async notifyOrderReceived(order: NotifiableOrder): Promise<void> {
    const itemsSummary = summarizeItems(order.items);

    await this.notifyCustomer({
      type: NotificationType.ORDER_RECEIVED,
      category: NotificationCategory.ORDER,
      title: `Order Received — ${order.orderNumber}`,
      message: `Hi ${order.customerName}, we've received your order ${order.orderNumber} (${itemsSummary}, ${formatNaira(order.totalAmount)}). We'll let you know once it's confirmed.`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
      whatsappVariables: {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': `We've received your order (${itemsSummary}, ${formatNaira(order.totalAmount)}). We'll confirm shortly.`,
      },
    });

    await this.notifyAdmin({
      type: NotificationType.NEW_ORDER_PLACED,
      category: NotificationCategory.ORDER,
      title: `New Order — ${order.orderNumber}`,
      message: [
        `New order received: ${order.orderNumber}`,
        `Customer: ${order.customerName} (${order.customerPhone})`,
        `Channel: ${order.channel}`,
        `Items: ${itemsSummary}`,
        `Total: ${formatNaira(order.totalAmount)}`,
      ].join('\n'),
      orderId: order.id,
    });

    if (order.channel === 'WHATSAPP' || order.channel === 'WEBSITE') {
      await this.sendWhatsAppRaw(STAFF_WHATSAPP_NUMBER, {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': `New order! Items: ${itemsSummary}. Total: ${formatNaira(order.totalAmount)}.`,
      });
    }
  }

  async notifyOrderConfirmed(order: NotifiableOrder): Promise<void> {
    await this.notifyCustomer({
      type: NotificationType.ORDER_CONFIRMED,
      category: NotificationCategory.ORDER,
      title: `Order Confirmed — ${order.orderNumber}`,
      message: `Hi ${order.customerName}, your order ${order.orderNumber} has been confirmed! We'll let you know as soon as it's ready.`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
      whatsappVariables: {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': "Your order has been confirmed! We'll let you know as soon as it's ready.",
      },
    });
  }

  async notifyOrderInPreparation(order: NotifiableOrder): Promise<void> {
    await this.notifyCustomer({
      type: NotificationType.ORDER_IN_PREPARATION,
      category: NotificationCategory.ORDER,
      title: `Order In Preparation — ${order.orderNumber}`,
      message: `Hi ${order.customerName}, your order ${order.orderNumber} is now being prepared.`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
      whatsappVariables: {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': 'Your order is now being prepared.',
      },
    });
  }

  async notifyOrderReady(order: NotifiableOrder): Promise<void> {
    const detail = readyMessageForOrderType(order.orderType);
    const type =
      order.orderType === 'DELIVERY'
        ? NotificationType.ORDER_OUT_FOR_DELIVERY
        : NotificationType.ORDER_READY;

    await this.notifyCustomer({
      type,
      category: NotificationCategory.ORDER,
      title: `Order Ready — ${order.orderNumber}`,
      message: `Hi ${order.customerName}, ${detail} (Order ${order.orderNumber})`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
      whatsappVariables: {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': detail,
      },
    });
  }

  async notifyOrderCompleted(order: NotifiableOrder): Promise<void> {
    await this.notifyCustomer({
      type: NotificationType.ORDER_COMPLETED,
      category: NotificationCategory.ORDER,
      title: `Order Completed — ${order.orderNumber}`,
      message: `Hi ${order.customerName}, thanks for ordering from Rera's Treat! Order ${order.orderNumber} is complete. We hope you enjoyed it!`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
      whatsappVariables: {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': "Thanks for ordering from Rera's Treat! We hope you enjoyed it.",
      },
    });
  }

  async notifyOrderCancelled(order: NotifiableOrder, reason?: string): Promise<void> {
    const detail =
      reason || "Your order was cancelled. Please contact us if you have questions.";

    await this.notifyCustomer({
      type: NotificationType.ORDER_REJECTED,
      category: NotificationCategory.ORDER,
      title: `Order Cancelled — ${order.orderNumber}`,
      message: `Hi ${order.customerName}, order ${order.orderNumber} was cancelled. ${detail}`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
      whatsappVariables: {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': detail,
      },
    });

    await this.notifyAdmin({
      type: NotificationType.ORDER_CANCELLED,
      category: NotificationCategory.ORDER,
      title: `Order Cancelled — ${order.orderNumber}`,
      message: `Order ${order.orderNumber} (${order.customerName}, ${order.customerPhone}) was cancelled.`,
      orderId: order.id,
    });
  }

  // ---------------------------------------------------------------------
  // Payment lifecycle
  // ---------------------------------------------------------------------

  async notifyPaymentInstructions(order: NotifiableOrder): Promise<void> {
    const detail = `Please pay ${formatNaira(order.totalAmount)} to ${PAYMENT_ACCOUNT.accountName}, ${PAYMENT_ACCOUNT.accountNumber} (${PAYMENT_ACCOUNT.bankName}). Reply once you've made the payment.`;

    await this.notifyCustomer({
      type: NotificationType.PAYMENT_INSTRUCTIONS_SENT,
      category: NotificationCategory.PAYMENT,
      title: `Payment Instructions — ${order.orderNumber}`,
      message: `Hi ${order.customerName}, ${detail}`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
      whatsappVariables: {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': detail,
      },
    });
  }

  async notifyPaymentAwaitingVerification(order: NotifiableOrder): Promise<void> {
    const itemsSummary = summarizeItems(order.items);

    await this.notifyAdmin({
      type: NotificationType.PAYMENT_AWAITING_VERIFICATION,
      category: NotificationCategory.PAYMENT,
      title: `Payment Awaiting Verification — ${order.orderNumber}`,
      message: [
        `Customer claims they've paid for order: ${order.orderNumber}`,
        `Customer: ${order.customerName} (${order.customerPhone})`,
        `Items: ${itemsSummary}`,
        `Total: ${formatNaira(order.totalAmount)}`,
        'Please verify the bank transfer and confirm payment in the admin panel.',
      ].join('\n'),
      orderId: order.id,
    });
  }

  async notifyPaymentReceived(order: NotifiableOrder): Promise<void> {
    await this.notifyCustomer({
      type: NotificationType.PAYMENT_RECEIVED,
      category: NotificationCategory.PAYMENT,
      title: `Payment Received — ${order.orderNumber}`,
      message: `Hi ${order.customerName}, we've received and verified your payment for order ${order.orderNumber}. Thank you!`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
      whatsappVariables: {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': "We've received and verified your payment. Thank you!",
      },
    });
  }

  async notifyPaymentFailed(order: NotifiableOrder): Promise<void> {
    await this.notifyCustomer({
      type: NotificationType.PAYMENT_FAILED,
      category: NotificationCategory.PAYMENT,
      title: `Payment Not Confirmed — ${order.orderNumber}`,
      message: `Hi ${order.customerName}, we couldn't confirm your payment for order ${order.orderNumber}. Please contact us or try again.`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
      whatsappVariables: {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': "We couldn't confirm your payment. Please contact us or try again.",
      },
    });

    await this.notifyAdmin({
      type: NotificationType.PAYMENT_FAILED,
      category: NotificationCategory.PAYMENT,
      title: `Payment Failed — ${order.orderNumber}`,
      message: `Payment for order ${order.orderNumber} (${order.customerName}, ${order.customerPhone}) was marked as failed.`,
      orderId: order.id,
    });
  }

  async notifyRefundProcessed(order: NotifiableOrder): Promise<void> {
    await this.notifyCustomer({
      type: NotificationType.REFUND_PROCESSED,
      category: NotificationCategory.PAYMENT,
      title: `Refund Processed — ${order.orderNumber}`,
      message: `Hi ${order.customerName}, your refund for order ${order.orderNumber} (${formatNaira(order.totalAmount)}) has been processed.`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
      whatsappVariables: {
        '1': order.customerName,
        '2': order.orderNumber,
        '3': `Your refund of ${formatNaira(order.totalAmount)} has been processed.`,
      },
    });

    await this.notifyAdmin({
      type: NotificationType.REFUND_PROCESSED,
      category: NotificationCategory.PAYMENT,
      title: `Refund Processed — ${order.orderNumber}`,
      message: `Refund processed for order ${order.orderNumber} (${order.customerName}, ${formatNaira(order.totalAmount)}).`,
      orderId: order.id,
    });
  }

  // ---------------------------------------------------------------------
  // Legacy entry points (kept for existing call sites / manual admin actions)
  // ---------------------------------------------------------------------

  async notifyNewOrder(order: NotifiableOrder): Promise<void> {
    await this.notifyOrderReceived(order);
  }

  async notifyPaymentClaimed(order: NotifiableOrder): Promise<void> {
    await this.notifyPaymentAwaitingVerification(order);
  }

  async sendOrderStatusMessage(
    order: NotifiableOrder,
    type: WhatsappMessageType,
    customMessage?: string,
  ): Promise<void> {
    switch (type) {
      case 'confirmation':
        await this.notifyOrderConfirmed(order);
        return;
      case 'payment-instruction':
        await this.notifyPaymentInstructions(order);
        return;
      case 'ready':
        await this.notifyOrderReady(order);
        return;
      case 'update': {
        const detail =
          customMessage ||
          "There's an update on your order. Please contact us for details.";

        await this.notifyCustomer({
          type: NotificationType.CUSTOM_UPDATE,
          category: NotificationCategory.ORDER,
          title: `Order Update — ${order.orderNumber}`,
          message: `Hi ${order.customerName}, ${detail}`,
          orderId: order.id,
          recipientPhone: order.customerPhone,
          recipientEmail: order.customerEmail,
          whatsappVariables: {
            '1': order.customerName,
            '2': order.orderNumber,
            '3': detail,
          },
        });
        return;
      }
    }
  }
}
