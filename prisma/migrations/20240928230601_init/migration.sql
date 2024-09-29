-- CreateTable
CREATE TABLE "Applications" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "firstRound" BOOLEAN NOT NULL,
    "finalRound" BOOLEAN NOT NULL,
    "offer" BOOLEAN NOT NULL,

    CONSTRAINT "Applications_pkey" PRIMARY KEY ("id")
);
