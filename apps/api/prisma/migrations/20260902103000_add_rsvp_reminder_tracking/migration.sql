-- AlterTable
ALTER TABLE "EventRsvp" ADD COLUMN     "confirmationSentAt" TIMESTAMP(3),
ADD COLUMN     "reminder3dSentAt" TIMESTAMP(3),
ADD COLUMN     "reminderDaySentAt" TIMESTAMP(3);
