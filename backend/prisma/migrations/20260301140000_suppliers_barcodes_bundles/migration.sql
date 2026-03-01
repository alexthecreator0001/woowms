-- Suppliers
CREATE TABLE "suppliers" (
  "id" SERIAL NOT NULL,
  "tenant_id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "suppliers_tenant_id_idx" ON "suppliers"("tenant_id");
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Supplier Products
CREATE TABLE "supplier_products" (
  "id" SERIAL NOT NULL,
  "supplier_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "supplier_sku" TEXT NOT NULL,
  "supplier_price" DECIMAL(10,2),
  "lead_time_days" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "supplier_products_supplier_id_product_id_key" ON "supplier_products"("supplier_id", "product_id");
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplier_id_fkey"
  FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product Barcodes
CREATE TABLE "product_barcodes" (
  "id" SERIAL NOT NULL,
  "product_id" INTEGER NOT NULL,
  "barcode" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'EAN13',
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_barcodes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_barcodes_barcode_key" ON "product_barcodes"("barcode");
CREATE INDEX "product_barcodes_product_id_idx" ON "product_barcodes"("product_id");
ALTER TABLE "product_barcodes" ADD CONSTRAINT "product_barcodes_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bundle Items
CREATE TABLE "bundle_items" (
  "id" SERIAL NOT NULL,
  "bundle_product_id" INTEGER NOT NULL,
  "component_product_id" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "bundle_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bundle_items_bundle_product_id_component_product_id_key" ON "bundle_items"("bundle_product_id", "component_product_id");
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_product_id_fkey"
  FOREIGN KEY ("bundle_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_component_product_id_fkey"
  FOREIGN KEY ("component_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product new columns
ALTER TABLE "products" ADD COLUMN "package_qty" INTEGER;
ALTER TABLE "products" ADD COLUMN "is_bundle" BOOLEAN NOT NULL DEFAULT false;

-- PurchaseOrder new columns
ALTER TABLE "purchase_orders" ADD COLUMN "supplier_id" INTEGER;
ALTER TABLE "purchase_orders" ADD COLUMN "tracking_number" TEXT;
ALTER TABLE "purchase_orders" ADD COLUMN "tracking_url" TEXT;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey"
  FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
