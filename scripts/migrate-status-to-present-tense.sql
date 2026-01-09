-- Migration script to update status values from past tense to present tense
-- This script is idempotent - safe to run multiple times
-- It only updates records that still have old status values

-- Applications: Update status values (only if they still have old values)
UPDATE "Applications_With_Outreach"
SET status = CASE
  WHEN status = 'applied' THEN 'applying'
  WHEN status = 'messagedHiringManager' THEN 'messagingHiringManager'
  WHEN status = 'messagedRecruiter' THEN 'messagingRecruiter'
  WHEN status = 'followedUp' THEN 'followingUp'
  WHEN status = 'interview' THEN 'interviewing'
  ELSE status
END
WHERE status IN ('applied', 'messagedHiringManager', 'messagedRecruiter', 'followedUp', 'interview');

-- LinkedIn Outreach: Update status values (only if they still have old values)
UPDATE "Linkedin_Outreach"
SET status = CASE
  WHEN status = 'outreachRequestSent' THEN 'sendingOutreachRequest'
  WHEN status = 'accepted' THEN 'acceptingRequest'
  WHEN status = 'followedUp' THEN 'followingUp'
  ELSE status
END
WHERE status IN ('outreachRequestSent', 'accepted', 'followedUp');

-- Events: Update status values (only if they still have old values)
UPDATE "In_Person_Events"
SET status = CASE
  WHEN status = 'scheduled' THEN 'scheduling'
  WHEN status = 'attended' THEN 'attending'
  WHEN status = 'linkedinRequestsSent' THEN 'sendingLinkedInRequests'
  WHEN status = 'followUp' THEN 'followingUp'
  ELSE status
END
WHERE status IN ('scheduled', 'attended', 'linkedinRequestsSent', 'followUp');

-- LeetCode: Update status values (only if they still have old values)
UPDATE "Leetcode_Practice"
SET status = CASE
  WHEN status = 'planned' THEN 'planning'
  WHEN status = 'solved' THEN 'solving'
  WHEN status = 'reflected' THEN 'reflecting'
  ELSE status
END
WHERE status IN ('planned', 'solved', 'reflected');
