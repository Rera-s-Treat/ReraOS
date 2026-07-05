-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ORDER_STATUS_CHANGED';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "orderId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_orderId_idx" ON "AuditLog"("orderId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
