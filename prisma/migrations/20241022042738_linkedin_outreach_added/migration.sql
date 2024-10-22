-- CreateTable
CREATE TABLE "Linkedin_Outreach" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "result" TEXT NOT NULL,

    CONSTRAINT "Linkedin_Outreach_pkey" PRIMARY KEY ("id")
);
