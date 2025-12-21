/*
  Warnings:

  - Added the required column `updatedAt` to the `Instructor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First add the column as nullable
ALTER TABLE "Instructor" ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Set default value for existing rows
UPDATE "Instructor" SET "updatedAt" = COALESCE("createdAt", NOW()) WHERE "updatedAt" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "Instructor" ALTER COLUMN "updatedAt" SET NOT NULL;
