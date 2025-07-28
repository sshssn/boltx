import { pgTable, unique, uuid, varchar, timestamp, text, integer, date, foreignKey, json, index, boolean, primaryKey } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"




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
},
(table) => {
	return {
		userUsernameUnique: unique("User_username_unique").on(table.username),
	}
});

export const message = pgTable("Message", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	role: varchar().notNull(),
	content: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		messageChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Message_chatId_Chat_id_fk"
		}),
	}
});

export const chat = pgTable("Chat", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	userId: uuid().notNull(),
	title: text().notNull(),
	visibility: varchar().default('private').notNull(),
},
(table) => {
	return {
		userCreatedAtIdx: index("user_created_at_idx").using("btree", table.userId.asc().nullsLast(), table.createdAt.desc().nullsFirst()),
		chatUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Chat_userId_User_id_fk"
		}),
	}
});

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
},
(table) => {
	return {
		suggestionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Suggestion_userId_User_id_fk"
		}),
		suggestionDocumentIdDocumentCreatedAtDocumentIdCreatedAtF: foreignKey({
			columns: [table.documentId, table.documentCreatedAt],
			foreignColumns: [document.createdAt, document.id],
			name: "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f"
		}),
	}
});

export const messageV2 = pgTable("Message_v2", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	role: varchar().notNull(),
	parts: json().notNull(),
	attachments: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		messageV2ChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Message_v2_chatId_Chat_id_fk"
		}),
	}
});

export const stream = pgTable("Stream", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		streamChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Stream_chatId_Chat_id_fk"
		}),
	}
});

export const usageLogs = pgTable("usage_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	messageCount: integer("message_count"),
	logDate: date("log_date").default(sql`CURRENT_DATE`),
},
(table) => {
	return {
		usageLogsUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "usage_logs_user_id_fkey"
		}),
	}
});

export const memory = pgTable("Memory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	content: text().notNull(),
},
(table) => {
	return {
		memoryUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Memory_userId_User_id_fk"
		}),
	}
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		idxPasswordResetTokensToken: index("idx_password_reset_tokens_token").using("btree", table.token.asc().nullsLast()),
		idxPasswordResetTokensUserId: index("idx_password_reset_tokens_user_id").using("btree", table.userId.asc().nullsLast()),
		passwordResetTokensUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "password_reset_tokens_user_id_fkey"
		}).onDelete("cascade"),
		passwordResetTokensTokenKey: unique("password_reset_tokens_token_key").on(table.token),
	}
});

export const messageUsage = pgTable("MessageUsage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	date: date().notNull(),
	messageCount: integer().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		messageUsageUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "MessageUsage_userId_User_id_fk"
		}),
	}
});

export const vote = pgTable("Vote", {
	chatId: uuid().notNull(),
	messageId: uuid().notNull(),
	isUpvoted: boolean().notNull(),
},
(table) => {
	return {
		voteChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Vote_chatId_Chat_id_fk"
		}),
		voteMessageIdMessageIdFk: foreignKey({
			columns: [table.messageId],
			foreignColumns: [message.id],
			name: "Vote_messageId_Message_id_fk"
		}),
		voteChatIdMessageIdPk: primaryKey({ columns: [table.chatId, table.messageId], name: "Vote_chatId_messageId_pk"}),
	}
});

export const voteV2 = pgTable("Vote_v2", {
	chatId: uuid().notNull(),
	messageId: uuid().notNull(),
	isUpvoted: boolean().notNull(),
},
(table) => {
	return {
		voteV2ChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Vote_v2_chatId_Chat_id_fk"
		}),
		voteV2MessageIdMessageV2IdFk: foreignKey({
			columns: [table.messageId],
			foreignColumns: [messageV2.id],
			name: "Vote_v2_messageId_Message_v2_id_fk"
		}),
		voteV2ChatIdMessageIdPk: primaryKey({ columns: [table.chatId, table.messageId], name: "Vote_v2_chatId_messageId_pk"}),
	}
});

export const document = pgTable("Document", {
	id: uuid().defaultRandom().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	title: text().notNull(),
	content: text(),
	userId: uuid().notNull(),
	text: varchar().default('text').notNull(),
},
(table) => {
	return {
		documentUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Document_userId_User_id_fk"
		}),
		documentIdCreatedAtPk: primaryKey({ columns: [table.id, table.createdAt], name: "Document_id_createdAt_pk"}),
	}
});