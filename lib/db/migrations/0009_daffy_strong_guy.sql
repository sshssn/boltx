ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "kind" varchar DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" DROP COLUMN IF EXISTS "text";