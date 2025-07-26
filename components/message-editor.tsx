'use client';

import { Button } from './ui/button';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Textarea } from './ui/textarea';
import { deleteTrailingMessages } from '@/app/(chat)/actions';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { getTextFromMessage } from '@/lib/utils';

export type MessageEditorProps = {
  message: ChatMessage;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
};

export function MessageEditor({
  message,
  setMode,
  setMessages,
  regenerate,
  limitReached = false,
}: MessageEditorProps & { limitReached?: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [draftContent, setDraftContent] = useState<string>(
    getTextFromMessage(message),
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (limitReached || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await deleteTrailingMessages({
        id: message.id,
      });

      setMessages((messages) => {
        const index = messages.findIndex((m) => m.id === message.id);

        if (index !== -1) {
          const updatedMessage: ChatMessage = {
            ...message,
            parts: [{ type: 'text', text: draftContent }],
          };

          return [...messages.slice(0, index), updatedMessage];
        }

        return messages;
      });

      setMode('view');
      regenerate();
    } catch (error) {
      console.error('Error sending edited message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        data-testid="message-editor"
        ref={textareaRef}
        className="bg-white/10 dark:bg-muted/30 backdrop-blur-md outline-none overflow-hidden resize-none !text-base rounded-xl w-full text-[#FAFAFA] shadow-lg border border-indigo-500/40"
        value={draftContent}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={limitReached}
      />

      <div className="flex flex-row gap-2 justify-end">
        <Button
          variant="ghost"
          className="h-fit py-2 px-3"
          onClick={() => {
            setMode('view');
          }}
          disabled={limitReached}
        >
          Cancel
        </Button>
        <Button
          data-testid="message-editor-send-button"
          variant="default"
          className="h-fit py-2 px-3 bg-indigo-600 text-white hover:bg-indigo-700"
          disabled={isSubmitting || limitReached}
          onClick={handleSend}
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
