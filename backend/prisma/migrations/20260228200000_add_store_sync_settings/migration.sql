-- AlterTable
ALTER TABLE "stores" ADD COLUMN "sync_orders" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "stores" ADD COLUMN "sync_products" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "stores" ADD COLUMN "sync_inventory" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "stores" ADD COLUMN "auto_sync" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "stores" ADD COLUMN "sync_interval_min" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "stores" ADD COLUMN "order_status_filter" TEXT[] DEFAULT ARRAY['processing', 'on-hold', 'pending']::TEXT[];
ALTER TABLE "stores" ADD COLUMN "sync_days_back" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "stores" ADD COLUMN "sync_since_date" TIMESTAMP(3);
