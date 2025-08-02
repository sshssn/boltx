CREATE TABLE IF NOT EXISTS "AdminMetadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" json,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "AdminMetadata_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Ticket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp,
	"assignedTo" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TicketReply" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticketId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"content" text NOT NULL,
	"isAdminReply" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "role" varchar(20) DEFAULT 'client';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedTo_User_id_fk" FOREIGN KEY ("assignedTo") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_ticketId_Ticket_id_fk" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
