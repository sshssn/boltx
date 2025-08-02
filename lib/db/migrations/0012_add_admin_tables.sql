-- Create admin tables for support tickets and admin functionality

-- Ticket table for support requests
CREATE TABLE IF NOT EXISTS "Ticket" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "type" varchar(20) NOT NULL,
  "subject" text NOT NULL,
  "description" text NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'open',
  "priority" varchar(20) NOT NULL DEFAULT 'medium',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "resolvedAt" timestamp,
  "assignedTo" uuid REFERENCES "User"("id")
);

-- TicketReply table for ticket responses
CREATE TABLE IF NOT EXISTS "TicketReply" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticketId" uuid NOT NULL REFERENCES "Ticket"("id") ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "content" text NOT NULL,
  "isAdminReply" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- AdminMetadata table for system configuration
CREATE TABLE IF NOT EXISTS "AdminMetadata" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" varchar(100) NOT NULL UNIQUE,
  "value" json,
  "description" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "ticket_user_id_idx" ON "Ticket"("userId");
CREATE INDEX IF NOT EXISTS "ticket_status_idx" ON "Ticket"("status");
CREATE INDEX IF NOT EXISTS "ticket_priority_idx" ON "Ticket"("priority");
CREATE INDEX IF NOT EXISTS "ticket_reply_ticket_id_idx" ON "TicketReply"("ticketId");
CREATE INDEX IF NOT EXISTS "ticket_reply_user_id_idx" ON "TicketReply"("userId"); 