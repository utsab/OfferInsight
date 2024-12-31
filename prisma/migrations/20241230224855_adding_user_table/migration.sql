/*
  Warnings:

  - Added the required column `userId` to the `Applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Applications_with_Outreach` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `In_Person_Events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Linkedin_Outreach` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Applications" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Applications_with_Outreach" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "In_Person_Events" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Linkedin_Outreach" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Applications" ADD CONSTRAINT "Applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applications_with_Outreach" ADD CONSTRAINT "Applications_with_Outreach_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Linkedin_Outreach" ADD CONSTRAINT "Linkedin_Outreach_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "In_Person_Events" ADD CONSTRAINT "In_Person_Events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
