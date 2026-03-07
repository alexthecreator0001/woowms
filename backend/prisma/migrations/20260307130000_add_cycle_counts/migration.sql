-- CreateEnum
CREATE TYPE "CycleCountStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CycleCountType" AS ENUM ('ZONE', 'LOCATION', 'PRODUCT');

-- CreateEnum
CREATE TYPE "CycleCountItemResolution" AS ENUM ('PENDING', 'ACCEPTED', 'DISMISSED');

-- CreateTable
CREATE TABLE "cycle_counts" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "cc_number" TEXT NOT NULL,
    "type" "CycleCountType" NOT NULL,
    "status" "CycleCountStatus" NOT NULL DEFAULT 'PLANNED',
    "warehouse_id" INTEGER NOT NULL,
    "zone_id" INTEGER,
    "blind_count" BOOLEAN NOT NULL DEFAULT false,
    "assigned_to_id" INTEGER,
    "assigned_to_name" TEXT,
    "planned_date" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_id" INTEGER,
    "created_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_count_items" (
    "id" SERIAL NOT NULL,
    "cycle_count_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "bin_id" INTEGER NOT NULL,
    "product_name" TEXT NOT NULL,
    "sku" TEXT,
    "bin_label" TEXT NOT NULL,
    "expected_qty" INTEGER NOT NULL,
    "counted_qty" INTEGER,
    "variance" INTEGER,
    "resolution" "CycleCountItemResolution" NOT NULL DEFAULT 'PENDING',
    "counted_at" TIMESTAMP(3),
    "counted_by_id" INTEGER,
    "counted_by_name" TEXT,
    "notes" TEXT,

    CONSTRAINT "cycle_count_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cycle_counts_cc_number_key" ON "cycle_counts"("cc_number");

-- CreateIndex
CREATE INDEX "cycle_counts_tenant_id_idx" ON "cycle_counts"("tenant_id");

-- CreateIndex
CREATE INDEX "cycle_counts_status_idx" ON "cycle_counts"("status");

-- CreateIndex
CREATE INDEX "cycle_count_items_cycle_count_id_idx" ON "cycle_count_items"("cycle_count_id");

-- AddForeignKey
ALTER TABLE "cycle_counts" ADD CONSTRAINT "cycle_counts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_cycle_count_id_fkey" FOREIGN KEY ("cycle_count_id") REFERENCES "cycle_counts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
