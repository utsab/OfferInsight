-- Rename dateCompleted to dateModified in all tables

ALTER TABLE "Applications_With_Outreach" RENAME COLUMN "dateCompleted" TO "dateModified";
ALTER TABLE "Linkedin_Outreach" RENAME COLUMN "dateCompleted" TO "dateModified";
ALTER TABLE "In_Person_Events" RENAME COLUMN "dateCompleted" TO "dateModified";
ALTER TABLE "Leetcode_Practice" RENAME COLUMN "dateCompleted" TO "dateModified";
