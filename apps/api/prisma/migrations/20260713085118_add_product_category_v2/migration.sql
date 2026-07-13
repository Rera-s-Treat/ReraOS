-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('PACKS', 'PLATTERS', 'WHOLE_MEALS', 'SPECIALS', 'DRINKS');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "categoryV2" "ProductCategory";

-- CreateIndex
CREATE INDEX "Product_categoryV2_idx" ON "Product"("categoryV2");
