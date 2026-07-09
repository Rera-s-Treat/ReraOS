-- AlterEnum
BEGIN;
CREATE TYPE "OrderChannel_new" AS ENUM ('WHATSAPP', 'MANUAL', 'WALK_IN', 'WEBSITE');
ALTER TABLE "Order" ALTER COLUMN "channel" TYPE "OrderChannel_new" USING ("channel"::text::"OrderChannel_new");
ALTER TYPE "OrderChannel" RENAME TO "OrderChannel_old";
ALTER TYPE "OrderChannel_new" RENAME TO "OrderChannel";
DROP TYPE "public"."OrderChannel_old";
COMMIT;
