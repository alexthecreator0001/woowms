-- Convert OrderStatus enum column to plain text
ALTER TABLE "orders" ALTER COLUMN "status" TYPE TEXT;
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE IF EXISTS "OrderStatus";

-- Add password reset fields to users
ALTER TABLE "users" ADD COLUMN "password_reset_code" TEXT;
ALTER TABLE "users" ADD COLUMN "password_reset_code_expires_at" TIMESTAMP(3);
