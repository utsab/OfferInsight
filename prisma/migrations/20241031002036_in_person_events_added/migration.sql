-- CreateTable
CREATE TABLE "In_Person_Events" (
    "id" SERIAL NOT NULL,
    "event" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "numPeopleSpokenTo" INTEGER NOT NULL,
    "numLinkedInRequests" INTEGER NOT NULL,

    CONSTRAINT "In_Person_Events_pkey" PRIMARY KEY ("id")
);
