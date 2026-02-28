-- Add legacy user limit columns expected by the app
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "user_type" text DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "daily_limit" integer DEFAULT 20;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "messages_sent_today" integer DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_reset" date;
