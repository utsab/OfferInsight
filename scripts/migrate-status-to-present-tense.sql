-- Migration script to update status values from past tense to present tense
-- Run this script to update existing records in the database

-- Applications: Update status values
UPDATE "Applications_With_Outreach"
SET status = CASE
  WHEN status = 'applied' THEN 'applying'
  WHEN status = 'messagedHiringManager' THEN 'messagingHiringManager'
  WHEN status = 'messagedRecruiter' THEN 'messagingRecruiter'
  WHEN status = 'followedUp' THEN 'followingUp'
  WHEN status = 'interview' THEN 'interviewing'
  ELSE status
END;

-- LinkedIn Outreach: Update status values
UPDATE "Linkedin_Outreach"
SET status = CASE
  WHEN status = 'outreachRequestSent' THEN 'sendingOutreachRequest'
  WHEN status = 'accepted' THEN 'acceptingRequest'
  WHEN status = 'followedUp' THEN 'followingUp'
  ELSE status
END;

-- Events: Update status values
UPDATE "In_Person_Events"
SET status = CASE
  WHEN status = 'scheduled' THEN 'scheduling'
  WHEN status = 'attended' THEN 'attending'
  WHEN status = 'linkedinRequestsSent' THEN 'sendingLinkedInRequests'
  WHEN status = 'followUp' THEN 'followingUp'
  ELSE status
END;

-- LeetCode: Update status values
UPDATE "Leetcode_Practice"
SET status = CASE
  WHEN status = 'planned' THEN 'planning'
  WHEN status = 'solved' THEN 'solving'
  WHEN status = 'reflected' THEN 'reflecting'
  ELSE status
END;
