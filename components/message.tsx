'use client';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, useEffect } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

// Type narrowing is handled by TypeScript's control flow analysis
// The AI SDK provides proper discriminated unions for tool calls

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
  isStreaming,
  style,
  limitReached = false,
  onContinue,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  isStreaming?: boolean;
  style?: React.CSSProperties;
  limitReached?: boolean;
  onContinue?: () => void;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === 'file',
  );

  // Check if message was cut off (ends abruptly)
  const [showNudgeButton, setShowNudgeButton] = useState(false);

  const isMessageCutOff =
    message.role === 'assistant' &&
    (() => {
      const textContent = message.parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('')
        .trim();

      // Only consider it cut off if:
      // 1. It's substantial content (more than 100 characters)
      // 2. It ends with specific cut-off indicators
      // 3. The AI is still actively streaming (not finished)
      if (textContent.length < 100) return false;

      // More specific cut-off indicators - only for obvious cases
      const cutOffIndicators = [
        /\.\.\.$/, // Ends with ellipsis
        /-$/, // Ends with dash (but not in URLs)
        /[^.!?]\s*$/, // Doesn't end with proper sentence punctuation
      ];

      // Check if it ends with a cut-off indicator
      const hasCutOffIndicator = cutOffIndicators.some((indicator) =>
        indicator.test(textContent),
      );

      // Only show cut-off if it has a clear indicator AND is substantial
      return hasCutOffIndicator && textContent.length > 200;
    })();

  // Show nudge button only after 30 seconds delay and only if AI is still streaming
  useEffect(() => {
    if (isMessageCutOff && isLoading) {
      const timer = setTimeout(() => {
        setShowNudgeButton(true);
      }, 30000); // 30 seconds delay

      return () => {
        clearTimeout(timer);
        setShowNudgeButton(false);
      };
    } else {
      // Immediately hide nudge button when:
      // 1. Message is not cut off
      // 2. AI is not loading (finished streaming)
      // 3. Component unmounts
      setShowNudgeButton(false);
    }
  }, [isMessageCutOff, isLoading]);

  // Additional effect to hide nudge button when streaming ends
  useEffect(() => {
    if (!isLoading && showNudgeButton) {
      // Hide nudge button immediately when AI finishes streaming
      setShowNudgeButton(false);
    }
  }, [isLoading, showNudgeButton]);

  useDataStream();

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message my-2"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
        style={style}
      >
        <div
          className={cn(
            'flex gap-2 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-md',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && false && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col w-full', {
              'gap-4 min-h-96':
                message.role === 'assistant' && requiresScrollPadding,
              'gap-2': message.role === 'user',
            })}
          >
            {attachmentsFromMessage.length > 0 && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {attachmentsFromMessage.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={{
                      name: attachment.filename ?? 'file',
                      contentType: attachment.mediaType,
                      url: attachment.url,
                    }}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning' && part.text?.trim().length > 0) {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.text}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-1 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-1 h-fit rounded-full text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 transition opacity-0 group-hover/message:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => {
                                setMode('edit');
                              }}
                              disabled={limitReached}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {limitReached
                              ? 'Message limit reached'
                              : 'Edit message'}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4 w-full', {
                          // User bubble: ChatGPT-style compact design
                          'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm rounded-lg px-1.5 py-px text-zinc-900 dark:text-zinc-100 text-sm leading-relaxed':
                            message.role === 'user',
                        })}
                      >
                        {message.role === 'assistant' ? (
                          <>
                            <Markdown>{sanitizeText(part.text)}</Markdown>
                            {showNudgeButton && (
                              <div className="flex items-center justify-between gap-3 mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="size-2 bg-blue-500 rounded-full animate-pulse" />
                                  <span className="text-sm text-blue-700 dark:text-blue-300">
                                    AI seems to be taking a while. Would you
                                    like to nudge it to continue?
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={onContinue}
                                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
                                >
                                  Continue
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <Markdown>{sanitizeText(part.text)}</Markdown>
                        )}
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div
                      key={key}
                      className="flex flex-row gap-1.5 items-start"
                    >
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        regenerate={regenerate}
                        limitReached={limitReached}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-getWeather') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  return (
                    <div key={toolCallId} className="skeleton">
                      <Weather />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;
                  return (
                    <div key={toolCallId}>
                      <Weather weatherAtLocation={output} />
                    </div>
                  );
                }
              }

              if (type === 'tool-createDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentPreview isReadonly={isReadonly} args={input} />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentPreview
                        isReadonly={isReadonly}
                        result={output}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-updateDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;

                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="update"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="update"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-requestSuggestions') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="request-suggestions"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="request-suggestions"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }
            })}

            {!isReadonly && (
              <MessageActions
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
                regenerate={regenerate}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return false;
  },
);

export const ThinkingMessage = () => {
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowMessage(true);
    }, 30000); // Show "taking longer than usual" after 30 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
      data-role="assistant"
    >
      <div className="flex gap-4 w-full">
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col items-center justify-center w-full py-8">
          <div className="flex items-center gap-1.5 mb-2">
            <div
              className="size-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
            />
            <div
              className="size-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: '160ms', animationDuration: '1.4s' }}
            />
            <div
              className="size-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: '320ms', animationDuration: '1.4s' }}
            />
          </div>
          {showSlowMessage && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 0.7, y: 0 }}
              className="text-sm text-muted-foreground text-center"
            >
              Taking longer than usual...
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
