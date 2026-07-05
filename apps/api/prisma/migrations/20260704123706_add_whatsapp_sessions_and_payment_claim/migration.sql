-- CreateEnum
CREATE TYPE "WhatsappSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WhatsappConversationStep" AS ENUM ('START', 'BROWSING_MENU', 'COLLECTING_ITEMS', 'COLLECTING_ORDER_TYPE', 'COLLECTING_NAME', 'COLLECTING_PHONE', 'COLLECTING_ADDRESS', 'REVIEWING_ORDER', 'AWAITING_CONFIRMATION', 'ORDER_CREATED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentClaimedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WhatsappSession" (
    "id" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "currentStep" "WhatsappConversationStep" NOT NULL DEFAULT 'START',
    "status" "WhatsappSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "orderType" "OrderType",
    "cartJson" JSONB,
    "deliveryAddress" TEXT,
    "notes" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappSession_customerPhone_key" ON "WhatsappSession"("customerPhone");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappSession_orderId_key" ON "WhatsappSession"("orderId");

-- CreateIndex
CREATE INDEX "WhatsappSession_status_idx" ON "WhatsappSession"("status");

-- CreateIndex
CREATE INDEX "WhatsappSession_currentStep_idx" ON "WhatsappSession"("currentStep");

-- AddForeignKey
ALTER TABLE "WhatsappSession" ADD CONSTRAINT "WhatsappSession_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
