-- CreateTable
CREATE TABLE "Applications_with_Outreach" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "hiringManager" TEXT NOT NULL,
    "msgToManager" TEXT NOT NULL,
    "recruiter" TEXT NOT NULL,
    "firstRound" BOOLEAN NOT NULL,
    "finalRound" BOOLEAN NOT NULL,
    "offer" BOOLEAN NOT NULL,

    CONSTRAINT "Applications_with_Outreach_pkey" PRIMARY KEY ("id")
);
