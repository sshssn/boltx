-- Add stripeCustomerId column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(255); 