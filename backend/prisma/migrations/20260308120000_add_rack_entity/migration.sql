-- CreateEnum
CREATE TYPE "RackType" AS ENUM ('SHELVING', 'PALLET');

-- CreateTable
CREATE TABLE "racks" (
    "id" SERIAL NOT NULL,
    "zone_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RackType" NOT NULL DEFAULT 'SHELVING',
    "prefix" TEXT,
    "description" TEXT,

    CONSTRAINT "racks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "racks" ADD CONSTRAINT "racks_zone_id_fkey"
  FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate existing bins: create one default rack per zone that has bins
INSERT INTO "racks" ("zone_id", "name", "type")
SELECT DISTINCT z.id, z.name, 'SHELVING'::"RackType"
FROM "zones" z INNER JOIN "bins" b ON b.zone_id = z.id;

-- Add rack_id column to bins
ALTER TABLE "bins" ADD COLUMN "rack_id" INTEGER;

-- Populate rack_id from the default racks we just created
UPDATE "bins" b SET "rack_id" = r.id
FROM "racks" r WHERE r.zone_id = b.zone_id;

-- Make rack_id NOT NULL
ALTER TABLE "bins" ALTER COLUMN "rack_id" SET NOT NULL;

-- Drop old zone_id foreign key and column
ALTER TABLE "bins" DROP CONSTRAINT IF EXISTS "bins_zone_id_fkey";
ALTER TABLE "bins" DROP COLUMN "zone_id";

-- Add new foreign key for rack_id
ALTER TABLE "bins" ADD CONSTRAINT "bins_rack_id_fkey"
  FOREIGN KEY ("rack_id") REFERENCES "racks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
