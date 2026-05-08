-- AlterTable
ALTER TABLE "Bead" ADD COLUMN     "mergedFrom" TEXT[] DEFAULT ARRAY[]::TEXT[];
