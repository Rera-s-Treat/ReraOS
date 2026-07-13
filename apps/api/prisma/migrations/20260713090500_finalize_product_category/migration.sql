-- Drop the old free-text category column (superseded by categoryV2's enum values).
ALTER TABLE "Product" DROP COLUMN "category";

-- Rename categoryV2 to category now that the enum is the sole source of truth.
ALTER TABLE "Product" RENAME COLUMN "categoryV2" TO "category";
