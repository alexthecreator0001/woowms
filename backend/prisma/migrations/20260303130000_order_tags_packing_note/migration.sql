-- AlterTable
ALTER TABLE "orders" ADD COLUMN "tags" JSONB DEFAULT '[]';
ALTER TABLE "orders" ADD COLUMN "packing_note" TEXT;
