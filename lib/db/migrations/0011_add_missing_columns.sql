-- Add missing columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(255);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" varchar(20) DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastUsernameChange" timestamp;

-- Update existing users to have the correct plan based on userType
UPDATE "User" SET "plan" = CASE 
  WHEN "userType" = 'pro' THEN 'pro'
  ELSE 'free'
END WHERE "plan" IS NULL; 