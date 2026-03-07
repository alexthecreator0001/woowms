-- CreateEnum
CREATE TYPE "RMAStatus" AS ENUM ('REQUESTED', 'AUTHORIZED', 'RECEIVING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('NEW', 'OPENED', 'DAMAGED', 'DEFECTIVE');

-- CreateEnum
CREATE TYPE "ItemResolution" AS ENUM ('PENDING', 'RESTOCK', 'DISPOSE', 'DAMAGED');

-- CreateTable
CREATE TABLE "return_orders" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "rma_number" TEXT NOT NULL,
    "order_id" INTEGER,
    "order_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "status" "RMAStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "notes" TEXT,
    "refund_amount" DECIMAL(10,2),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorized_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "created_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_order_items" (
    "id" SERIAL NOT NULL,
    "return_order_id" INTEGER NOT NULL,
    "product_id" INTEGER,
    "product_name" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "received_qty" INTEGER NOT NULL DEFAULT 0,
    "condition" "ItemCondition" NOT NULL DEFAULT 'NEW',
    "resolution" "ItemResolution" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "return_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "return_orders_rma_number_key" ON "return_orders"("rma_number");

-- CreateIndex
CREATE INDEX "return_orders_tenant_id_idx" ON "return_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "return_orders_status_idx" ON "return_orders"("status");

-- CreateIndex
CREATE INDEX "return_orders_order_number_idx" ON "return_orders"("order_number");

-- CreateIndex
CREATE INDEX "return_order_items_return_order_id_idx" ON "return_order_items"("return_order_id");

-- AddForeignKey
ALTER TABLE "return_orders" ADD CONSTRAINT "return_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_order_items" ADD CONSTRAINT "return_order_items_return_order_id_fkey" FOREIGN KEY ("return_order_id") REFERENCES "return_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
