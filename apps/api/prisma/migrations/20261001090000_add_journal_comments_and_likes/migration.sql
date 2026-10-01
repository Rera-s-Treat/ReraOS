-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NEW_JOURNAL_COMMENT';

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- CreateTable
CREATE TABLE "JournalComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalComment_postId_idx" ON "JournalComment"("postId");

-- CreateIndex
CREATE INDEX "JournalComment_status_idx" ON "JournalComment"("status");

-- AddForeignKey
ALTER TABLE "JournalComment" ADD CONSTRAINT "JournalComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "JournalPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "JournalLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "anonymousId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalLike_postId_anonymousId_key" ON "JournalLike"("postId", "anonymousId");

-- CreateIndex
CREATE INDEX "JournalLike_postId_idx" ON "JournalLike"("postId");

-- AddForeignKey
ALTER TABLE "JournalLike" ADD CONSTRAINT "JournalLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "JournalPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
