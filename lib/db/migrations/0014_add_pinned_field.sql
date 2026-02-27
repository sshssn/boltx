-- Add pinned field to Chat table
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "pinned" BOOLEAN DEFAULT FALSE; 