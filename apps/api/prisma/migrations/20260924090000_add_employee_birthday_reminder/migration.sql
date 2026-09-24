-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'EMPLOYEE_BIRTHDAY_UPCOMING';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "birthdayReminderSentYear" INTEGER;
