-- Seed instructor00 if it doesn't exist
INSERT INTO "Instructor" (id, username, password, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'instructor00',
  '$2b$10$YLzaAHx27cnUWdtIikojoup/pGBOJhhUPWwKluIxnMeLsoIoyugny'
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Instructor" WHERE username = 'instructor00'
);

