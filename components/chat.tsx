'use client';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import type { Session } from 'next-auth';
import type { Attachment, ChatMessage } from '@/lib/types';
import { SuggestedActions } from './suggested-actions';

interface ChatProps {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: ChatProps) {
  // Use the real chat hook
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    // input,
    // setInput,
    // attachments,
    // setAttachments,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    // Add other config as needed
  });
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const inputDisabled = false;
  const visibilityType = initialVisibilityType;
  const isArtifactVisible = false;
  const handleGuestLimit = () => {};
  const votes: Vote[] = [];

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-[#f7f7f8] dark:bg-[#15171a]">
      <div className="flex-1 flex flex-col relative" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-8 pb-32">
            <SuggestedActions
              chatId={id}
              sendMessage={sendMessage}
              selectedVisibilityType={visibilityType}
              setInput={setInput}
            />
          </div>
        ) : (
          <Messages
            chatId={id}
            status={status}
            messages={messages}
            setMessages={setMessages}
            regenerate={regenerate}
            isReadonly={isReadonly}
            isArtifactVisible={isArtifactVisible}
            extraPaddingBottom
            onGuestLimit={handleGuestLimit}
            votes={votes}
          />
        )}
        {/* Input form - always visible */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <form
            className="flex mx-auto px-4 gap-2 w-full md:max-w-3xl"
            style={{ border: 'none', boxShadow: 'none' }}
          >
            {!isReadonly && (
              <MultimodalInput
                chatId={id}
                input={input}
                setInput={setInput}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                sendMessage={sendMessage}
                setMessages={setMessages}
                className="bg-background dark:bg-muted"
                selectedVisibilityType={visibilityType}
                disabled={inputDisabled}
                limitReached={inputDisabled}
              />
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
