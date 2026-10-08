-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'CASH');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'TRANSFER';

-- AlterTable
ALTER TABLE "OrderPayment" ADD COLUMN "method" "PaymentMethod" NOT NULL DEFAULT 'TRANSFER';
