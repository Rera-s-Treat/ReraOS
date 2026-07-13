-- Drop the old enum-typed category column now that categoryId (FK to the
-- new Category table) is populated for every product.
ALTER TABLE "Product" DROP COLUMN "category";

-- Drop the now-unused enum type itself.
DROP TYPE "ProductCategory";
