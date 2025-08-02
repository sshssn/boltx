-- Add pinned field to Chat table
ALTER TABLE "Chat" ADD COLUMN "pinned" BOOLEAN DEFAULT FALSE; 