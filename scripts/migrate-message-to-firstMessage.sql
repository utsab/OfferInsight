-- Migration script to rename 'message' column to 'firstMessage' in Linkedin_Outreach table
-- This script is idempotent - safe to run multiple times
-- It only renames the column if it still exists with the old name

DO $$
BEGIN
    -- Check if 'message' column exists and rename it to 'firstMessage'
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Linkedin_Outreach' 
        AND column_name = 'message'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Linkedin_Outreach" RENAME COLUMN "message" TO "firstMessage";
    END IF;
END $$;
