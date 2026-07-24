-- CreateEnum
CREATE TYPE "CommunityTown" AS ENUM ('OGIJO', 'ITAOLUWO', 'SHIMAWA', 'ODONGUYAN', 'LUKOSI');

-- CreateEnum
CREATE TYPE "CommunityMenuInterest" AS ENUM ('SMALL_CHOPS', 'FINGER_FOODS', 'PASTA', 'DRINKS');

-- CreateTable
CREATE TABLE "CommunityMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "town" "CommunityTown" NOT NULL,
    "menuInterest" "CommunityMenuInterest",
    "welcomeSentAt" TIMESTAMP(3),
    "welcomeSendError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityMember_town_idx" ON "CommunityMember"("town");

-- CreateIndex
CREATE INDEX "CommunityMember_createdAt_idx" ON "CommunityMember"("createdAt");
