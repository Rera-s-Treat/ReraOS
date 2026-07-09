-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_RECEIVED', 'ORDER_CONFIRMED', 'ORDER_REJECTED', 'ORDER_IN_PREPARATION', 'ORDER_READY', 'ORDER_OUT_FOR_DELIVERY', 'ORDER_COMPLETED', 'NEW_ORDER_PLACED', 'UNPAID_ORDER_AWAITING_ACTION', 'ORDER_CANCELLED', 'ORDER_STUCK_PENDING', 'ORDER_READY_NOT_PICKED_UP', 'PAYMENT_INSTRUCTIONS_SENT', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYMENT_AWAITING_VERIFICATION', 'REFUND_PROCESSED', 'CUSTOM_UPDATE', 'PRODUCT_LOW_STOCK', 'PRODUCT_OUT_OF_STOCK', 'DAILY_SALES_SUMMARY', 'WEEKLY_PERFORMANCE_SUMMARY', 'NEW_CUSTOMER_MILESTONE', 'NOTIFICATION_DELIVERY_FAILURE');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('ORDER', 'PAYMENT', 'INVENTORY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationAudience" AS ENUM ('ADMIN', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'WHATSAPP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "audience" "NotificationAudience" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'SENT',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_audience_idx" ON "Notification"("audience");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_orderId_idx" ON "Notification"("orderId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
