-- Add MFA fields to User table
ALTER TABLE "User" ADD COLUMN "mfaEnabled" BOOLEAN DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN "mfaSecret" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN "mfaBackupCodes" JSONB; 