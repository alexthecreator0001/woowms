-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PACKER';

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN "website" TEXT;
