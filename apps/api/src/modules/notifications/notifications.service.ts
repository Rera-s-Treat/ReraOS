import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationAudience,
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationType,
} from '@prisma/client';

import { buildBrandedEmailHtml } from '../../common/email-template';
import { normalizeNigerianPhoneNumber } from '../../common/phone';
import { PAYMENT_ACCOUNT } from '../../common/payment-account';
import { PrismaService } from '../../common/prisma.service';

const STAFF_EMAIL = process.env.STAFF_NOTIFICATION_EMAIL || 'rerastreat@gmail.com';
const ADMIN_CC_EMAIL =
  process.env.ADMIN_NOTIFICATION_CC_EMAIL || 'adeeyotemitope5@gmail.com';
const STAFF_SMS_NUMBER =
  process.env.STAFF_NOTIFICATION_PHONE || '09124800610';
const PICKUP_LOCATION = process.env.PICKUP_LOCATION_LABEL || 'Ogijo, Ogun State';

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_DEFAULT_FROM = "Rera's Treat <onboarding@resend.dev>";

const BREVO_SMS_API_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';
const BREVO_DEFAULT_SENDER = 'RerasTreat';

export type OrderNotificationType =
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
  deliveryAddress?: string | null;
  totalAmount: unknown;
  items: Array<{ quantity: number; product: { name: string } }>;
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
  emailBody: string;
  smsBody: string;
  orderId?: string;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
}

function formatNaira(amount: unknown): string {
  return `₦${Number(amount).toLocaleString()}`;
}

function summarizeItems(items: NotifiableOrder['items']): string {
  return items.map((item) => `${item.quantity}× ${item.product.name}`).join(', ');
}

function fulfillmentLine(order: NotifiableOrder): string {
  if (order.orderType === 'DELIVERY') {
    return `Delivering to:\n${order.deliveryAddress || 'the address you provided'}`;
  }
  return `Pickup location:\n${PICKUP_LOCATION}`;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get isEmailConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY);
  }

  private get isSmsConfigured(): boolean {
    return Boolean(process.env.BREVO_API_KEY);
  }

  private async sendEmailRaw(
    to: string,
    subject: string,
    text: string,
    cc?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isEmailConfigured) {
      this.logger.warn(
        `[Email skipped - no Resend API key configured] To: ${to} | Subject: ${subject}\n${text}`,
      );
      return { success: false, error: 'Resend API key not configured' };
    }

    try {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || RESEND_DEFAULT_FROM,
          to: [to],
          cc: cc ? [cc] : undefined,
          subject,
          text,
          html: buildBrandedEmailHtml(text),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Failed to send email to ${to}: ${response.status} ${errorBody}`);
        return { success: false, error: `${response.status}: ${errorBody}` };
      }

      return { success: true };
    } catch (error) {
      const message = (error as Error).message || String(error);
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      return { success: false, error: message };
    }
  }

  private async sendSmsRaw(
    to: string,
    message: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isSmsConfigured) {
      this.logger.warn(
        `[SMS skipped - no Brevo API key configured] To: ${to} | Message: ${message}`,
      );
      return { success: false, error: 'Brevo API key not configured' };
    }

    try {
      const response = await fetch(BREVO_SMS_API_URL, {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: process.env.BREVO_SMS_SENDER || BREVO_DEFAULT_SENDER,
          recipient: normalizeNigerianPhoneNumber(to),
          content: message,
          type: 'transactional',
        }),
      });

      const responseBody = await response.text();

      if (!response.ok) {
        this.logger.error(`SMS send to ${to} failed: ${response.status} ${responseBody}`);
        return { success: false, error: `${response.status}: ${responseBody}` };
      }
      return { success: true };
    } catch (error) {
      const message = (error as Error).message || String(error);
      this.logger.error(`Failed to send SMS to ${to}: ${message}`);
      return { success: false, error: message };
    }
  }

  /** Public low-level senders, kept for direct/manual use (e.g. admin-triggered custom messages). */
  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    await this.sendEmailRaw(to, subject, text);
  }

  async sendSms(to: string, message: string): Promise<void> {
    await this.sendSmsRaw(to, message);
  }

  /**
   * Fires an admin-facing notification: the in-app record is written immediately
   * (fast, no network call), while the actual email delivery runs in the
   * background so a slow/hanging SMTP connection never blocks the caller.
   */
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

    void this.deliverAdminEmail(payload).catch((error) =>
      this.logger.error('Unexpected error delivering admin email', error as Error),
    );
  }

  private async deliverAdminEmail(payload: DispatchAdminPayload): Promise<void> {
    const cc = process.env.RESEND_DOMAIN_VERIFIED === 'true' ? ADMIN_CC_EMAIL : undefined;

    const result = await this.sendEmailRaw(
      STAFF_EMAIL,
      payload.title,
      payload.message,
      cc,
    );

    await this.prisma.notification.create({
      data: {
        type: payload.type,
        category: payload.category,
        audience: NotificationAudience.ADMIN,
        channel: NotificationChannel.EMAIL,
        status: result.success
          ? NotificationDeliveryStatus.SENT
          : NotificationDeliveryStatus.SKIPPED,
        title: payload.title,
        message: payload.message,
        recipientEmail: STAFF_EMAIL,
        orderId: payload.orderId,
        errorMessage: result.error,
      },
    });

    if (!result.success) {
      await this.recordDeliveryFailure(
        `Admin email notification (${payload.type}) was not sent: ${result.error}`,
        payload.orderId,
      );
    }
  }

  /**
   * Fires a customer-facing notification via SMS and/or email, whichever
   * contact info is available. Both deliveries run in the background so a
   * slow/hanging provider never blocks the caller (e.g. order creation).
   */
  async notifyCustomer(payload: DispatchCustomerPayload): Promise<void> {
    if (payload.recipientPhone) {
      void this.deliverCustomerSms(payload).catch((error) =>
        this.logger.error('Unexpected error delivering customer SMS', error as Error),
      );
    }

    if (payload.recipientEmail) {
      void this.deliverCustomerEmail(payload).catch((error) =>
        this.logger.error('Unexpected error delivering customer email', error as Error),
      );
    }
  }

  private async deliverCustomerSms(payload: DispatchCustomerPayload): Promise<void> {
    const result = await this.sendSmsRaw(payload.recipientPhone!, payload.smsBody);

    await this.prisma.notification.create({
      data: {
        type: payload.type,
        category: payload.category,
        audience: NotificationAudience.CUSTOMER,
        channel: NotificationChannel.SMS,
        status: result.success
          ? NotificationDeliveryStatus.SENT
          : NotificationDeliveryStatus.SKIPPED,
        title: payload.title,
        message: payload.smsBody,
        recipientPhone: payload.recipientPhone,
        orderId: payload.orderId,
        errorMessage: result.error,
      },
    });

    if (!result.success) {
      await this.recordDeliveryFailure(
        `Customer SMS notification (${payload.type}) to ${payload.recipientPhone} was not sent: ${result.error}`,
        payload.orderId,
      );
    }
  }

  private async deliverCustomerEmail(payload: DispatchCustomerPayload): Promise<void> {
    const result = await this.sendEmailRaw(
      payload.recipientEmail!,
      payload.title,
      payload.emailBody,
    );

    await this.prisma.notification.create({
      data: {
        type: payload.type,
        category: payload.category,
        audience: NotificationAudience.CUSTOMER,
        channel: NotificationChannel.EMAIL,
        status: result.success
          ? NotificationDeliveryStatus.SENT
          : NotificationDeliveryStatus.SKIPPED,
        title: payload.title,
        message: payload.emailBody,
        recipientEmail: payload.recipientEmail,
        orderId: payload.orderId,
        errorMessage: result.error,
      },
    });
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
    const total = formatNaira(order.totalAmount);

    await this.notifyCustomer({
      type: NotificationType.ORDER_RECEIVED,
      category: NotificationCategory.ORDER,
      title: `Order Received — ${order.orderNumber}`,
      emailBody: `Hi ${order.customerName},

Your order #${order.orderNumber} has landed with us.

You ordered:
${itemsSummary}

Total: ${total}

We're just confirming your payment. Once that's sorted, we'll get to the important part — making your food.

We'll keep you posted.

Rera's Treat
Come hungry. We have plenty.`,
      smsBody: `Hi ${order.customerName} 👋🏽

We got your order #${order.orderNumber}.

Your total is ${total} and we're confirming your payment now.

Once that's done, we'll get cooking.

— Rera's Treat`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
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
        `Total: ${total}`,
      ].join('\n'),
      orderId: order.id,
    });

    if (order.channel === 'WHATSAPP' || order.channel === 'WEBSITE') {
      await this.sendSmsRaw(
        STAFF_SMS_NUMBER,
        `New order! #${order.orderNumber} — ${itemsSummary}. Total: ${total}.`,
      );
    }
  }

  async notifyOrderConfirmed(order: NotifiableOrder): Promise<void> {
    const itemsSummary = summarizeItems(order.items);
    const total = formatNaira(order.totalAmount);

    await this.notifyCustomer({
      type: NotificationType.ORDER_CONFIRMED,
      category: NotificationCategory.ORDER,
      title: `Order Confirmed — ${order.orderNumber}`,
      emailBody: `Hi ${order.customerName},

Payment received. Order #${order.orderNumber} is officially confirmed.

And now?

We cook. 🍴

Your order:
${itemsSummary}

Total: ${total}

We'll let you know when it's ready.

Try not to think about the food too much.

Rera's Treat`,
      smsBody: `Payment received. ✔️

Order #${order.orderNumber} is confirmed, ${order.customerName}.

Now we're cooking. 🍴

We'll let you know when it's ready.

Rera's Treat`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
    });
  }

  async notifyOrderInPreparation(order: NotifiableOrder): Promise<void> {
    const itemsSummary = summarizeItems(order.items);
    const fulfillmentWord = order.orderType === 'DELIVERY' ? 'delivery' : 'pickup';

    await this.notifyCustomer({
      type: NotificationType.ORDER_IN_PREPARATION,
      category: NotificationCategory.ORDER,
      title: `Order In Preparation — ${order.orderNumber}`,
      emailBody: `Hi ${order.customerName},

Your order #${order.orderNumber} is in the kitchen.

We're making it fresh because stale food has no business here.

You're getting:
${itemsSummary}

We're on it. We'll let you know when it's ready for ${fulfillmentWord}.

In the meantime, consider this your official warning:

You might be hungry by the time it arrives.

Rera's Treat`,
      smsBody: `Hi ${order.customerName} 🍴

Your order #${order.orderNumber} is in the kitchen.

We're making it fresh because stale food has no business here.

We'll let you know when it's ready for ${fulfillmentWord}.

Rera's Treat`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
    });
  }

  async notifyOrderReady(order: NotifiableOrder): Promise<void> {
    const itemsSummary = summarizeItems(order.items);
    const type =
      order.orderType === 'DELIVERY'
        ? NotificationType.ORDER_OUT_FOR_DELIVERY
        : NotificationType.ORDER_READY;

    if (order.orderType === 'DELIVERY') {
      await this.notifyCustomer({
        type,
        category: NotificationCategory.ORDER,
        title: `Order Out for Delivery — ${order.orderNumber}`,
        emailBody: `Hi ${order.customerName},

The food has left us and is making its way to you.

Order #${order.orderNumber} is officially on the way.

Delivering to:
${order.deliveryAddress || 'the address you provided'}

Keep your phone close so your rider can reach you when they arrive.

And please, don't make the food wait at the door.

Rera's Treat`,
        smsBody: `Hi ${order.customerName} 👀

Your Rera's Treat order #${order.orderNumber} is on its way.

📍 ${order.deliveryAddress || 'your address'}

Keep your phone close for your rider's call.

Your food is coming. Please don't make it wait. 😌

— Rera's Treat`,
        orderId: order.id,
        recipientPhone: order.customerPhone,
        recipientEmail: order.customerEmail,
      });
      return;
    }

    await this.notifyCustomer({
      type,
      category: NotificationCategory.ORDER,
      title: `Order Ready — ${order.orderNumber}`,
      emailBody: `Hi ${order.customerName},

Your order #${order.orderNumber} is ready.

Yes, that means you can stop thinking about it and come get it. 😌

Pickup location:
${PICKUP_LOCATION}

Order:
${itemsSummary}

Please have your order number handy when you arrive.

We'll be here.

Rera's Treat
Come hungry. We have plenty.`,
      smsBody: `Hi ${order.customerName} 👋🏽

Your order #${order.orderNumber} is ready.

No more waiting. Come get your food. 😌

📍 ${PICKUP_LOCATION}

Order number: #${order.orderNumber}

See you soon.

— Rera's Treat`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
    });
  }

  async notifyOrderCompleted(order: NotifiableOrder): Promise<void> {
    await this.notifyCustomer({
      type: NotificationType.ORDER_COMPLETED,
      category: NotificationCategory.ORDER,
      title: `Order Completed — ${order.orderNumber}`,
      emailBody: `Hi ${order.customerName},

Order #${order.orderNumber} has been completed.

Now we need to know:

Was it good?

Tell us what you thought. We read every review, and yes, we like the good ones very much. 😌

Until your next order,

Rera's Treat
Come hungry. We have plenty.`,
      smsBody: `Hi ${order.customerName} 💛

Order #${order.orderNumber} is complete.

Now, tell us honestly...

How was it? 👀

We'd love to hear from you.

— Rera's Treat`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
    });
  }

  async notifyOrderCancelled(order: NotifiableOrder, reason?: string): Promise<void> {
    const itemsSummary = summarizeItems(order.items);
    const total = formatNaira(order.totalAmount);
    const cancellationReason = reason || 'Please contact us if you have questions.';

    await this.notifyCustomer({
      type: NotificationType.ORDER_REJECTED,
      category: NotificationCategory.ORDER,
      title: `Order Cancelled — ${order.orderNumber}`,
      emailBody: `Hi ${order.customerName},

Your order #${order.orderNumber} has been cancelled.

Order:
${itemsSummary}

Total: ${total}

Reason: ${cancellationReason}

We're sorry this one didn't make it to you.

We hope we get another chance to feed you soon.

Rera's Treat`,
      smsBody: `Hi ${order.customerName},

Your order #${order.orderNumber} has been cancelled.

Reason: ${cancellationReason}

We're sorry this one didn't make it to you — we hope we get another chance to feed you soon.

— Rera's Treat`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
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
      emailBody: `Hi ${order.customerName},\n\n${detail}`,
      smsBody: `Hi ${order.customerName}, ${detail}`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
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
      emailBody: `Hi ${order.customerName},\n\nWe've received and verified your payment for order #${order.orderNumber}. Thank you!\n\nRera's Treat`,
      smsBody: `Hi ${order.customerName}, we've received and verified your payment for order #${order.orderNumber}. Thank you! — Rera's Treat`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
    });
  }

  async notifyPaymentFailed(order: NotifiableOrder): Promise<void> {
    await this.notifyCustomer({
      type: NotificationType.PAYMENT_FAILED,
      category: NotificationCategory.PAYMENT,
      title: `Payment Not Confirmed — ${order.orderNumber}`,
      emailBody: `Hi ${order.customerName},\n\nWe couldn't confirm your payment for order #${order.orderNumber}. Please contact us or try again.\n\nRera's Treat`,
      smsBody: `Hi ${order.customerName}, we couldn't confirm your payment for order #${order.orderNumber}. Please contact us or try again. — Rera's Treat`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
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
    const total = formatNaira(order.totalAmount);

    await this.notifyCustomer({
      type: NotificationType.REFUND_PROCESSED,
      category: NotificationCategory.PAYMENT,
      title: `Refund Processed — ${order.orderNumber}`,
      emailBody: `Hi ${order.customerName},\n\nYour refund for order #${order.orderNumber} (${total}) has been processed.\n\nRera's Treat`,
      smsBody: `Hi ${order.customerName}, your refund of ${total} for order #${order.orderNumber} has been processed. — Rera's Treat`,
      orderId: order.id,
      recipientPhone: order.customerPhone,
      recipientEmail: order.customerEmail,
    });

    await this.notifyAdmin({
      type: NotificationType.REFUND_PROCESSED,
      category: NotificationCategory.PAYMENT,
      title: `Refund Processed — ${order.orderNumber}`,
      message: `Refund processed for order ${order.orderNumber} (${order.customerName}, ${total}).`,
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
    type: OrderNotificationType,
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
          emailBody: `Hi ${order.customerName},\n\n${detail}\n\nRera's Treat`,
          smsBody: `Hi ${order.customerName}, ${detail} — Rera's Treat`,
          orderId: order.id,
          recipientPhone: order.customerPhone,
          recipientEmail: order.customerEmail,
        });
        return;
      }
    }
  }
}
