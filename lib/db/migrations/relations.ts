import { relations } from "drizzle-orm/relations";
import { chat, message, user, suggestion, document, messageV2, stream, memory, passwordResetTokens, messageUsage, ticket, ticketReply, vote, voteV2 } from "./schema";

export const messageRelations = relations(message, ({one, many}) => ({
	chat: one(chat, {
		fields: [message.chatId],
		references: [chat.id]
	}),
	votes: many(vote),
}));

export const chatRelations = relations(chat, ({one, many}) => ({
	messages: many(message),
	user: one(user, {
		fields: [chat.userId],
		references: [user.id]
	}),
	messageV2s: many(messageV2),
	streams: many(stream),
	votes: many(vote),
	voteV2s: many(voteV2),
}));

export const userRelations = relations(user, ({many}) => ({
	chats: many(chat),
	suggestions: many(suggestion),
	memories: many(memory),
	passwordResetTokens: many(passwordResetTokens),
	messageUsages: many(messageUsage),
	ticketReplies: many(ticketReply),
	tickets_userId: many(ticket, {
		relationName: "ticket_userId_user_id"
	}),
	tickets_assignedTo: many(ticket, {
		relationName: "ticket_assignedTo_user_id"
	}),
	documents: many(document),
}));

export const suggestionRelations = relations(suggestion, ({one}) => ({
	user: one(user, {
		fields: [suggestion.userId],
		references: [user.id]
	}),
	document: one(document, {
		fields: [suggestion.documentId],
		references: [document.id]
	}),
}));

export const documentRelations = relations(document, ({one, many}) => ({
	suggestions: many(suggestion),
	user: one(user, {
		fields: [document.userId],
		references: [user.id]
	}),
}));

export const messageV2Relations = relations(messageV2, ({one, many}) => ({
	chat: one(chat, {
		fields: [messageV2.chatId],
		references: [chat.id]
	}),
	voteV2s: many(voteV2),
}));

export const streamRelations = relations(stream, ({one}) => ({
	chat: one(chat, {
		fields: [stream.chatId],
		references: [chat.id]
	}),
}));

export const memoryRelations = relations(memory, ({one}) => ({
	user: one(user, {
		fields: [memory.userId],
		references: [user.id]
	}),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(user, {
		fields: [passwordResetTokens.userId],
		references: [user.id]
	}),
}));

export const messageUsageRelations = relations(messageUsage, ({one}) => ({
	user: one(user, {
		fields: [messageUsage.userId],
		references: [user.id]
	}),
}));

export const ticketReplyRelations = relations(ticketReply, ({one}) => ({
	ticket: one(ticket, {
		fields: [ticketReply.ticketId],
		references: [ticket.id]
	}),
	user: one(user, {
		fields: [ticketReply.userId],
		references: [user.id]
	}),
}));

export const ticketRelations = relations(ticket, ({one, many}) => ({
	ticketReplies: many(ticketReply),
	user_userId: one(user, {
		fields: [ticket.userId],
		references: [user.id],
		relationName: "ticket_userId_user_id"
	}),
	user_assignedTo: one(user, {
		fields: [ticket.assignedTo],
		references: [user.id],
		relationName: "ticket_assignedTo_user_id"
	}),
}));

export const voteRelations = relations(vote, ({one}) => ({
	chat: one(chat, {
		fields: [vote.chatId],
		references: [chat.id]
	}),
	message: one(message, {
		fields: [vote.messageId],
		references: [message.id]
	}),
}));

export const voteV2Relations = relations(voteV2, ({one}) => ({
	chat: one(chat, {
		fields: [voteV2.chatId],
		references: [chat.id]
	}),
	messageV2: one(messageV2, {
		fields: [voteV2.messageId],
		references: [messageV2.id]
	}),
}));