-- AlterEnum
ALTER TYPE "POStatus" ADD VALUE 'SHIPPED';
ALTER TYPE "POStatus" ADD VALUE 'RECEIVED_WITH_RESERVATIONS';

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN "invoice_number" TEXT;
ALTER TABLE "purchase_orders" ADD COLUMN "invoice_date" TIMESTAMP(3);
ALTER TABLE "purchase_orders" ADD COLUMN "invoice_amount" DECIMAL(10,2);
ALTER TABLE "purchase_orders" ADD COLUMN "invoice_file_url" TEXT;
ALTER TABLE "purchase_orders" ADD COLUMN "sent_at" TIMESTAMP(3);
