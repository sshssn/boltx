-- Add lastUsernameChange column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastUsernameChange" timestamp; 