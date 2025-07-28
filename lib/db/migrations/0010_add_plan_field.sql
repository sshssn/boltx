-- Add plan column to User table
ALTER TABLE "User" ADD COLUMN "plan" varchar(20) DEFAULT 'free'; 