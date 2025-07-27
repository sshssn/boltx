'use client';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import type { Vote } from '@/lib/db/schema';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import type { Session } from 'next-auth';
import type { Attachment, ChatMessage } from '@/lib/types';
import { SuggestedActions } from './suggested-actions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import { useSession } from 'next-auth/react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { useCopyToClipboard } from 'usehooks-ts';
import { toast } from 'sonner';
import { useMessageLimit } from '@/components/message-limit-provider';
import { X, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ChatTitleManager } from './chat-title-manager';

interface ChatProps {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}

// Enhanced Error Display Component
function ErrorDisplay({
  error,
  onRetry,
  isRetrying,
}: { error: any; onRetry: () => void; isRetrying?: boolean }) {
  const getErrorMessage = (error: any) => {
    if (error?.status === 429) {
      return 'Rate limit exceeded. Please try again in a moment.';
    }
    if (error?.status === 403) {
      return 'Access denied. Please check your API configuration.';
    }
    if (error?.status >= 500) {
      return 'Server error. Our team has been notified.';
    }
    if (
      error?.message?.includes('network') ||
      error?.message?.includes('fetch')
    ) {
      return 'Network connection failed. Please check your internet and try again.';
    }
    return 'Connection failed. Please check your internet and try again.';
  };

  return (
    <div className="flex justify-center w-full px-4 mb-4">
      <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 backdrop-blur-xl border border-red-200/80 dark:border-red-800/60 shadow-lg rounded-xl px-4 py-3 max-w-md">
        <div className="flex items-center gap-2 flex-1">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Failed to get response from AI
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">
              {getErrorMessage(error)}
            </p>
          </div>
        </div>
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          size="sm"
          variant="outline"
          className="flex items-center gap-1 bg-white dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/70 text-xs px-3 py-1.5 h-auto disabled:opacity-50"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3" />
              Retry
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Enhanced Guest Message Limit Component with better mobile styling
function GuestMessageLimit({ messages }: { messages: ChatMessage[] }) {
  const { data: session } = useSession();
  const [showLimit, setShowLimit] = useState(true);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const {
    messagesUsed,
    messagesLimit,
    isLoading,
    isGuest,
    isRegular,
    remaining,
    hasReachedLimit,
    incrementMessageCount,
  } = useMessageLimit();

  useEffect(() => {
    const userMessages = messages.filter((msg) => msg.role === 'user');
    if (userMessages.length > messagesUsed) {
      const diff = userMessages.length - messagesUsed;
      for (let i = 0; i < diff; i++) {
        incrementMessageCount();
      }
    }
  }, [messages, messagesUsed, incrementMessageCount]);

  useEffect(() => {
    if ((isGuest || isRegular) && hasReachedLimit) {
      setShowSignupModal(true);
    }
  }, [isGuest, isRegular, hasReachedLimit]);

  if (!showLimit || (!isGuest && !isRegular)) return null;

  return (
    <>
      <div className="flex justify-center w-full px-3 mb-4">
        <div className="flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xl rounded-xl text-sm font-medium px-4 py-3 transition-all duration-200 hover:bg-white dark:hover:bg-zinc-900 max-w-full">
          {isGuest ? (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-zinc-700 dark:text-zinc-300 whitespace-nowrap flex items-center gap-1">
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {remaining}
                </span>
                <span className="hidden sm:inline">messages left today</span>
                <span className="sm:hidden">left today</span>
              </span>
              <a
                href="/auth"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors duration-200 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="hidden sm:inline">Sign up free</span>
                <span className="sm:hidden">Sign up</span>
                <Sparkles className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-zinc-700 dark:text-zinc-300 whitespace-nowrap flex items-center gap-1">
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {remaining}
                </span>
                <span className="hidden sm:inline">messages left today</span>
                <span className="sm:hidden">left today</span>
              </span>
              <a
                href="/account"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors duration-200 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Upgrade
                <Sparkles className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <AlertDialogContent className="sm:max-w-md mx-4 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Message Limit Reached
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-600 dark:text-zinc-400">
              You&apos;ve reached your daily message limit. Sign up for free to
              get more messages or upgrade to Pro for unlimited access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <X className="size-4 mr-2" />
                Close
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                className="w-full sm:w-auto order-1 sm:order-2"
                onClick={() =>
                  window.open(isGuest ? '/auth' : '/account', '_blank')
                }
              >
                <Sparkles className="size-4 mr-2" />
                {isGuest ? 'Sign Up Free' : 'Upgrade'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
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
  const isMobile = useIsMobile();
  const router = useRouter();
  const [_, copyToClipboard] = useCopyToClipboard();
  const [isArtifactVisible, setIsArtifactVisible] = useState(false);
  const [lastError, setLastError] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const {
    messages,
    setMessages,
    sendMessage: sendMessageHook,
    status,
    stop,
    regenerate,
    error,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    onError: (error) => {
      console.error('Chat error:', error);
      setLastError(error);
      handleApiError(error);
    },
  });

  const [input, setInput] = useState('');
  // Only disable input when actually streaming, not when there's an error
  const inputDisabled = status === 'streaming' && !lastError;
  const visibilityType = initialVisibilityType;

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);

  // Clear error when messages change successfully
  useEffect(() => {
    if (messages.length > 0 && lastError) {
      setLastError(null);
    }
  }, [messages.length, lastError]);

  // Emit new chat creation event when chat starts
  useEffect(() => {
    if (messages.length === 0 && id) {
      // Emit custom event for new chat creation
      const event = new CustomEvent('new-chat-created', {
        detail: { chatId: id },
      });
      window.dispatchEvent(event);

      // Also dispatch chat-created event for title system
      const titleEvent = new CustomEvent('chat-created', {
        detail: { chatId: id },
      });
      window.dispatchEvent(titleEvent);
    }
  }, [id, messages.length]);

  const handleGuestLimit = () => {};

  const handleNewChat = () => {
    router.push('/');
  };

  const handleSearch = () => {
    // Implement search functionality
    console.log('Search triggered');
  };

  const handleToggleTheme = () => {
    // Implement theme toggle
    console.log('Theme toggle triggered');
  };

  const handleRegenerate = () => {
    setLastError(null);
    regenerate();
  };

  const sendMessage = async (
    message: any,
    options?: { attachments?: Attachment[] },
  ) => {
    if (options?.attachments) {
      setAttachments(options.attachments);
    }

    try {
      setLastError(null);
      await sendMessageHook(message);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setLastError(error);
      handleApiError(error);
    }
  };

  const handleCopyLastMessage = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      const content =
        lastMessage.parts?.find((part) => part.type === 'text')?.text || '';
      copyToClipboard(content);
      toast.success('Message copied to clipboard');
    } else {
      toast.error('No assistant message to copy');
    }
  };

  // Handle API errors gracefully with better mobile-friendly toasts
  const handleApiError = (error: any) => {
    // Check for rate limiting in error message
    if (
      error?.status === 429 ||
      error?.message?.includes('rate limited') ||
      error?.details?.includes('rate limited')
    ) {
      toast.error(
        'Rate limit exceeded. Please try again later or upgrade your plan.',
        {
          duration: 5000,
          action: {
            label: 'Upgrade',
            onClick: () => router.push('/account'),
          },
        },
      );
    } else if (error?.status === 403) {
      toast.error('API access denied. Please check your configuration.', {
        duration: 4000,
      });
    } else if (
      error?.message?.includes('API keys') ||
      error?.details?.includes('API keys')
    ) {
      toast.error(
        'API service temporarily unavailable. Please try again later.',
        {
          duration: 4000,
        },
      );
    } else {
      toast.error('AI service temporarily unavailable. Please try again.', {
        duration: 3000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        },
      });
    }
  };

  // Enhanced error handling for message sending
  const handleSendMessage = async (
    message: string,
    attachments?: Attachment[],
  ) => {
    try {
      await sendMessage(message, { attachments });
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setLastError(error);
      handleApiError(error);
    }
  };

  const handleRetry = () => {
    setLastError(null);
    setIsRetrying(true);
    // Get the last user message and retry it
    const lastUserMessage = messages.findLast((m) => m.role === 'user');
    if (lastUserMessage) {
      const messageText =
        lastUserMessage.parts?.find((part) => part.type === 'text')?.text || '';
      if (messageText) {
        sendMessage(messageText);
      }
    }
    setIsRetrying(false);
  };

  // Clear error when user sends a new message
  const handleNewMessage = async (message: any) => {
    setLastError(null); // Clear any previous errors
    try {
      await sendMessageHook(message);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setLastError(error);
      handleApiError(error);
      // Don't throw the error further to prevent unhandled promise rejections
    }
  };

  return (
    <>
      <KeyboardShortcuts
        onNewChat={handleNewChat}
        onSearch={handleSearch}
        onToggleTheme={handleToggleTheme}
        onCopyLastMessage={handleCopyLastMessage}
        onRegenerate={regenerate}
        onStopGeneration={stop}
      />

      {/* Chat Title Manager - handles real-time title generation */}
      {messages.length > 0 && (
        <ChatTitleManager
          chatId={id}
          userMessage={
            messages
              .find((m) => m.role === 'user')
              ?.parts?.find((part) => part.type === 'text')?.text || ''
          }
          aiResponse={
            messages
              .find((m) => m.role === 'assistant')
              ?.parts?.find((part) => part.type === 'text')?.text
          }
        />
      )}

      <div
        className={`
        flex flex-col min-w-0 h-dvh chat-container
        bg-white dark:bg-zinc-950
        transition-all duration-300
      `}
      >
        <div className="flex-1 flex flex-col relative" style={{ minHeight: 0 }}>
          {messages.length === 0 ? (
            <div
              className={`
              flex-1 flex items-center justify-center py-8 px-4
              ${isMobile ? 'pb-24' : 'pb-36'}
            `}
            >
              <div className="w-full max-w-2xl">
                <SuggestedActions
                  chatId={id}
                  sendMessage={sendMessageHook}
                  selectedVisibilityType={initialVisibilityType}
                  setInput={setInput}
                />
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

          {/* Enhanced Input Section - Mobile Optimized */}
          <div
            className={`
            absolute inset-x-0 bottom-0 z-10
            bg-gradient-to-t from-white via-white to-transparent 
            dark:from-zinc-950 dark:via-zinc-950 dark:to-transparent
            ${isMobile ? 'pb-safe' : ''}
          `}
          >
            {/* Error Display */}
            {lastError && (
              <ErrorDisplay
                error={lastError}
                onRetry={handleRetry}
                isRetrying={isRetrying}
              />
            )}

            {/* Message Limit Display */}
            <GuestMessageLimit messages={messages} />

            <div
              className={`
              flex mx-auto gap-2 w-full
              ${isMobile ? 'px-3 sm:px-4' : 'px-6 md:max-w-4xl'}
              pb-4
            `}
            >
              {!isReadonly && (
                <div className="w-full">
                  <MultimodalInput
                    chatId={id}
                    input={input}
                    setInput={setInput}
                    status={status}
                    stop={stop}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    messages={messages}
                    sendMessage={handleNewMessage}
                    setMessages={setMessages}
                    selectedVisibilityType={initialVisibilityType}
                    disabled={inputDisabled}
                    limitReached={inputDisabled}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
