import { pgTable, unique, serial, varchar, text, timestamp, uuid, integer, date, boolean, jsonb, foreignKey, json, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const systemSettings = pgTable("SystemSettings", {
	id: serial().primaryKey().notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	unique("SystemSettings_key_key").on(table.key),
]);

export const user = pgTable("User", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 64 }).notNull(),
	password: varchar({ length: 64 }),
	username: varchar({ length: 32 }),
	deletedAt: timestamp({ mode: 'string' }),
	userType: text("user_type").default('free'),
	dailyLimit: integer("daily_limit").default(20),
	messagesSentToday: integer("messages_sent_today").default(0),
	lastReset: date("last_reset"),
	stripeCustomerId: varchar({ length: 255 }),
	plan: varchar({ length: 20 }).default('free'),
	lastUsernameChange: timestamp({ mode: 'string' }),
	role: varchar({ length: 20 }).default('client'),
	mfaEnabled: boolean().default(false),
	mfaSecret: varchar({ length: 255 }),
	mfaBackupCodes: jsonb(),
}, (table) => [
	unique("User_username_unique").on(table.username),
]);

export const message = pgTable("Message", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	role: varchar().notNull(),
	content: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Message_chatId_Chat_id_fk"
		}),
]);

export const chat = pgTable("Chat", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	userId: uuid().notNull(),
	title: text().notNull(),
	visibility: varchar().default('private').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Chat_userId_User_id_fk"
		}),
]);

export const suggestion = pgTable("Suggestion", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentId: uuid().notNull(),
	documentCreatedAt: timestamp({ mode: 'string' }).notNull(),
	originalText: text().notNull(),
	suggestedText: text().notNull(),
	description: text(),
	isResolved: boolean().default(false).notNull(),
	userId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Suggestion_userId_User_id_fk"
		}),
	foreignKey({
			columns: [table.documentId, table.documentCreatedAt],
			foreignColumns: [document.id, document.createdAt],
			name: "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f"
		}),
]);

export const messageV2 = pgTable("Message_v2", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	role: varchar().notNull(),
	parts: json().notNull(),
	attachments: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Message_v2_chatId_Chat_id_fk"
		}),
]);

export const stream = pgTable("Stream", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Stream_chatId_Chat_id_fk"
		}),
]);

export const memory = pgTable("Memory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	content: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Memory_userId_User_id_fk"
		}),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "password_reset_tokens_user_id_User_id_fk"
		}).onDelete("cascade"),
	unique("password_reset_tokens_token_unique").on(table.token),
]);

export const adminMetadata = pgTable("AdminMetadata", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: json(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("AdminMetadata_key_unique").on(table.key),
]);

export const messageUsage = pgTable("MessageUsage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	date: date().notNull(),
	messageCount: integer().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "MessageUsage_userId_User_id_fk"
		}),
]);

export const ticketReply = pgTable("TicketReply", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ticketId: uuid().notNull(),
	userId: uuid().notNull(),
	content: text().notNull(),
	isAdminReply: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [ticket.id],
			name: "TicketReply_ticketId_Ticket_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "TicketReply_userId_User_id_fk"
		}),
]);

export const ticket = pgTable("Ticket", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	type: varchar({ length: 20 }).notNull(),
	subject: text().notNull(),
	description: text().notNull(),
	status: varchar({ length: 20 }).default('open').notNull(),
	priority: varchar({ length: 20 }).default('medium').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	assignedTo: uuid(),
	attachments: json().default([]),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Ticket_userId_User_id_fk"
		}),
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [user.id],
			name: "Ticket_assignedTo_User_id_fk"
		}),
]);

export const vote = pgTable("Vote", {
	chatId: uuid().notNull(),
	messageId: uuid().notNull(),
	isUpvoted: boolean().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Vote_chatId_Chat_id_fk"
		}),
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [message.id],
			name: "Vote_messageId_Message_id_fk"
		}),
	primaryKey({ columns: [table.chatId, table.messageId], name: "Vote_chatId_messageId_pk"}),
]);

export const voteV2 = pgTable("Vote_v2", {
	chatId: uuid().notNull(),
	messageId: uuid().notNull(),
	isUpvoted: boolean().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Vote_v2_chatId_Chat_id_fk"
		}),
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messageV2.id],
			name: "Vote_v2_messageId_Message_v2_id_fk"
		}),
	primaryKey({ columns: [table.chatId, table.messageId], name: "Vote_v2_chatId_messageId_pk"}),
]);

export const document = pgTable("Document", {
	id: uuid().defaultRandom().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	title: text().notNull(),
	content: text(),
	userId: uuid().notNull(),
	kind: varchar().default('text').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Document_userId_User_id_fk"
		}),
	primaryKey({ columns: [table.id, table.createdAt], name: "Document_id_createdAt_pk"}),
]);
