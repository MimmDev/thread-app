/*
  Warnings:

  - You are about to drop the column `supersedes` on the `Bead` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bead" DROP CONSTRAINT "Bead_supersedes_fkey";

-- AlterTable
ALTER TABLE "Bead" DROP COLUMN "supersedes";
