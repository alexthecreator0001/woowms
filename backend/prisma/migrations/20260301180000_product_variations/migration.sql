-- AlterTable
ALTER TABLE "products" ADD COLUMN "product_type" TEXT NOT NULL DEFAULT 'simple';
ALTER TABLE "products" ADD COLUMN "woo_parent_id" INTEGER;
ALTER TABLE "products" ADD COLUMN "variant_attributes" JSONB;
