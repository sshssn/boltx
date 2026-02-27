-- Add plan column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" varchar(20) DEFAULT 'free'; 