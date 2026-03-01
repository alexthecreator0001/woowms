-- CreateEnum
CREATE TYPE "BinSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'XLARGE');

-- CreateEnum
CREATE TYPE "ProductSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'XLARGE', 'OVERSIZED');

-- AlterTable
ALTER TABLE "bins" ADD COLUMN "bin_size" "BinSize" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "max_weight" DECIMAL(8,3),
ADD COLUMN "pickable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sellable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "products" ADD COLUMN "size_category" "ProductSize";
