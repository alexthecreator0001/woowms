-- AlterTable: Add shipping/payment fields to orders
ALTER TABLE "orders" ADD COLUMN "payment_method" TEXT;
ALTER TABLE "orders" ADD COLUMN "payment_method_title" TEXT;
ALTER TABLE "orders" ADD COLUMN "is_paid" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "orders" ADD COLUMN "shipping_method" TEXT;
ALTER TABLE "orders" ADD COLUMN "shipping_method_title" TEXT;

-- AlterTable: Add shipping provider fields to stores
ALTER TABLE "stores" ADD COLUMN "shipping_provider" TEXT;
ALTER TABLE "stores" ADD COLUMN "shipping_api_key" TEXT;

-- CreateTable: Shipping method mappings
CREATE TABLE "shipping_mappings" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "woo_method_id" TEXT NOT NULL,
    "woo_method_title" TEXT NOT NULL,
    "provider_carrier" TEXT,
    "provider_service" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipping_mappings_store_id_woo_method_id_key" ON "shipping_mappings"("store_id", "woo_method_id");

-- AddForeignKey
ALTER TABLE "shipping_mappings" ADD CONSTRAINT "shipping_mappings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
