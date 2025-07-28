'use server';

import { generateText } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
  updateChatTitleById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';
import {
  generateTitleFromUserMessage as generateTitle,
  updateThreadTitle,
} from '@/lib/ai/title-generation';
import type { ChatMessage } from '@/lib/types';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: ChatMessage;
}) {
  const cookieStore = await cookies();
  const selectedModelId =
    cookieStore.get('chat-model')?.value || 'gemini-2.5-flash';

  // Extract the text content from the message
  const userText =
    (message.parts?.[0] as any)?.text || (message as any)?.content || '';

  // Generate title using the AI-based function
  return generateTitle(userText, {
    selectedModelId,
  });
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const messages = await getMessageById({ id });

  if (!messages || messages.length === 0) {
    throw new Error(`Message with id ${id} not found`);
  }

  const message = messages[0];

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export async function updateChatTitle({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  await updateChatTitleById({ chatId, title });
  // Note: updateThreadTitle is client-side only, so we don't call it here
  // The UI should listen for database changes or use the event system
}
