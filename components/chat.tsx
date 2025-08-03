'use client';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useCallback } from 'react';
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

import { useCopyToClipboard } from 'usehooks-ts';
import { toast } from 'sonner';
import { useMessageLimit } from '@/components/message-limit-provider';
import { X, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showLoginToast } from '@/components/auth-toast';
import { ChatTitleManager } from './chat-title-manager';
import { GlobalMessageLimit } from '@/components/global-message-limit';
import { CompactUsageCounter } from '@/components/compact-usage-counter';
import { RateLimitMessage } from '@/components/rate-limit-message';
import { LoaderIcon } from './icons';
import { WebSearchLoading } from './web-search-loading';
import { generateUUID } from '@/lib/utils';

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
      if (
        error?.message?.includes('web search') ||
        error?.message?.includes('authentication')
      ) {
        return 'Web search requires authentication. Please sign in to use this feature.';
      }
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
          <AlertTriangle className="size-5 text-red-600 dark:text-red-400 shrink-0" />
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
              <RefreshCw className="size-3 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="size-3" />
              Retry
            </>
          )}
        </Button>
      </div>
    </div>
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
  const { open: sidebarOpen } = useSidebar();

  // Detect OAuth login success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const error = urlParams.get('error');

    if (oauthSuccess === 'true' && session?.user) {
      showLoginToast();
      // Clean up the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('oauth_success');
      window.history.replaceState({}, '', newUrl.toString());
    }

    // Also detect successful OAuth login by checking if we have a session and came from auth page
    if (session?.user && document.referrer.includes('/auth')) {
      showLoginToast();
    }
  }, [session?.user]);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [isArtifactVisible, setIsArtifactVisible] = useState(false);
  const [lastError, setLastError] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSlowResponse, setIsSlowResponse] = useState(false);

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
    experimental_streamData: true,
    experimental_onFunctionCall: () => {
      // Handle function calls if needed
    },
    onFinish: (message) => {
      // Handle message completion
      console.log('Message finished streaming:', message);
    },
    onResponse: (response) => {
      // Handle response start
      console.log('Response started');
    },
    body: {
      id,
      selectedChatModel: initialChatModel,
      message:
        initialMessages.length > 0
          ? initialMessages[initialMessages.length - 1]
          : undefined, // Send only the latest message
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const [input, setInput] = useState('');
  // Only disable input when actually streaming, not when there's an error
  const inputDisabled = status === 'streaming';
  const visibilityType = initialVisibilityType;

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentTitle, setCurrentTitle] = useState<string>('New Chat');
  const [isTitleGenerating, setIsTitleGenerating] = useState<boolean>(false);
  const [isWebSearchMode, setIsWebSearchMode] = useState<boolean>(false);

  // Get message limit data for the main chat component
  let hasReachedLimit = false;
  try {
    const messageLimitData = useMessageLimit();
    hasReachedLimit = messageLimitData.hasReachedLimit;
  } catch (error) {
    // MessageLimitProvider not available (e.g., for admin users)
    hasReachedLimit = false;
  }
  const [showRateLimitMessage, setShowRateLimitMessage] = useState(false);

  // Clear error when messages change successfully
  useEffect(() => {
    if (messages.length > 0 && lastError && status !== 'error') {
      setLastError(null);
    }
  }, [messages.length, lastError, status]);

  // Monitor for slow responses - only trigger after 30 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (status === 'streaming') {
      timeoutId = setTimeout(() => {
        setIsSlowResponse(true);
      }, 30000); // Show slow response warning after 30 seconds
    } else {
      setIsSlowResponse(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status]);

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

  // Listen for title update events from ChatTitleManager
  useEffect(() => {
    const handleTitleUpdate = (event: CustomEvent) => {
      const { chatId, title, isGenerating, status } = event.detail;

      // Only update if this event is for our current chat
      if (chatId === id) {
        setCurrentTitle(title || 'New Chat');
        setIsTitleGenerating(isGenerating || false);

        // Update browser tab title
        if (title && title !== 'New Chat' && title !== 'New Thread...') {
          document.title = `${title} - boltX`;
        } else {
          document.title = 'boltX';
        }
      }
    };

    window.addEventListener(
      'chat-title-update',
      handleTitleUpdate as EventListener,
    );
    return () =>
      window.removeEventListener(
        'chat-title-update',
        handleTitleUpdate as EventListener,
      );
  }, [id]);

  const handleGuestLimit = () => {};

  const handleNewChat = () => {
    router.push('/');
  };

  const handleSearch = () => {
    // Focus the input field
    const inputElement = document.querySelector(
      'textarea[placeholder*="message"], input[placeholder*="message"]',
    ) as HTMLTextAreaElement | HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleToggleTheme = () => {
    // Toggle theme using next-themes
    const themeToggle = document.querySelector(
      '[data-theme-toggle]',
    ) as HTMLElement;
    if (themeToggle) {
      themeToggle.click();
    }
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
    // Check if error is retryable
    const isRetryable = error?.retryable !== false;
    const errorMessage =
      error?.error || error?.message || 'Unknown error occurred';

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
    } else if (error?.status === 408) {
      // Timeout error - show retry option
      toast.error('AI response took too long. Please try again.', {
        duration: 4000,
        action: isRetryable
          ? {
              label: 'Retry',
              onClick: () => handleRetry(),
            }
          : undefined,
      });
    } else if (error?.status === 503) {
      // Network error - show retry option
      toast.error(
        'Network connection failed. Please check your internet and try again.',
        {
          duration: 4000,
          action: isRetryable
            ? {
                label: 'Retry',
                onClick: () => handleRetry(),
              }
            : undefined,
        },
      );
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
      // Generic error with smart retry
      toast.error(errorMessage, {
        duration: 3000,
        action: isRetryable
          ? {
              label: 'Retry',
              onClick: () => handleRetry(),
            }
          : undefined,
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
      // Pass the entire message object, not just the text
      setTimeout(() => {
        sendMessageHook(lastUserMessage);
        setIsRetrying(false);
      }, 1000);
    } else {
      setIsRetrying(false);
    }
  };

  const handleContinue = () => {
    if (messages.length > 0 && status === 'streaming') {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        // Send a continue request to the API
        const continueMessage = {
          id: generateUUID(),
          role: 'user' as const,
          content: 'Continue your response from where you left off.',
          parts: [
            {
              type: 'text' as const,
              text: 'Continue your response from where you left off.',
            },
          ],
          createdAt: new Date(),
          metadata: { continue: true },
        };

        // Add the continue flag to the message
        const messageWithContinue = {
          ...continueMessage,
          continue: true, // This will be picked up by the API
        };

        handleNewMessage(messageWithContinue);

        toast.success('Nudging AI to continue...', {
          duration: 2000,
        });
      }
    }
  };

  // Force reset chat state to prevent loops
  const forceResetChat = useCallback(() => {
    // Clear all cached data
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();

      // Clear any chat-specific storage
      Object.keys(localStorage).forEach((key) => {
        if (key.includes('chat') || key.includes('message')) {
          localStorage.removeItem(key);
        }
      });

      Object.keys(sessionStorage).forEach((key) => {
        if (key.includes('chat') || key.includes('message')) {
          sessionStorage.removeItem(key);
        }
      });
    }

    // Reset messages to initial state
    setMessages(initialMessages);
    setLastError(null);
    setIsRetrying(false);
    setIsSlowResponse(false);

    // Force page reload to clear all state
    window.location.reload();
  }, [initialMessages, setMessages]);

  // Clear error when user sends a new message
  const handleNewMessage = async (message: any) => {
    // Only clear error if we're not currently in an error state
    if (status !== 'error') {
      setLastError(null);
    }

    // Check if this is a web search message
    const isWebSearch = message?.metadata?.webSearch === true;
    setIsWebSearchMode(isWebSearch);

    // Clear any cached state to prevent loops
    if (typeof window !== 'undefined') {
      // Clear any stored chat state
      localStorage.removeItem(`chat-${id}`);
      sessionStorage.removeItem(`chat-${id}`);
    }

    try {
      // Check if user has reached limit
      if (hasReachedLimit) {
        setShowRateLimitMessage(true);
        // Hide the message after 5 seconds
        setTimeout(() => setShowRateLimitMessage(false), 5000);
        return;
      }

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
          isStreaming={status === 'streaming'}
          onTitleChange={(title, isGenerating) => {
            setCurrentTitle(title);
            setIsTitleGenerating(isGenerating);

            // Update browser tab title
            if (title && title !== 'New Chat' && title !== 'New Thread...') {
              document.title = `${title} - boltX`;
            } else {
              document.title = 'boltX';
            }
          }}
        />
      )}

      <div
        className={`
        flex flex-col min-w-0 h-screen chat-container
        bg-white dark:bg-zinc-950
        transition-all duration-300
        text-base leading-relaxed
        ${isMobile ? 'pb-safe' : ''}
        relative
      `}
      >
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {messages.length === 0 ? (
            <div
              className={`
              flex-1 flex items-center justify-center p-4
              ${isMobile ? 'pb-24' : 'pb-36'}
              overflow-y-auto
              safe-area-inset-bottom
            `}
            >
              <div className="w-full max-w-2xl">
                <SuggestedActions
                  chatId={id}
                  sendMessage={(message: string) =>
                    sendMessageHook({ text: message })
                  }
                  selectedVisibilityType={initialVisibilityType}
                  setInput={setInput}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Title Generation Indicator */}
              {isTitleGenerating && (
                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200/50 dark:border-blue-800/50">
                  <div className="animate-spin">
                    <LoaderIcon size={14} />
                  </div>
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    New Thread...
                  </span>
                </div>
              )}

              {/* Messages Container - Mobile Optimized */}
              <div
                className={`
                flex-1 overflow-y-auto
                ${isMobile ? 'pb-24' : 'pb-36'}
                safe-area-inset-bottom
                scroll-smooth
              `}
              >
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
                  limitReached={hasReachedLimit}
                  isWebSearchMode={isWebSearchMode}
                />
              </div>

              {/* Reset button for debugging */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-4 right-4 z-50">
                  <button
                    type="button"
                    onClick={forceResetChat}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    title="Reset chat state (dev only)"
                  >
                    Reset Chat
                  </button>
                </div>
              )}
            </>
          )}

          {/* Enhanced Input Section - Mobile Optimized */}
          <div
            className={`
            fixed inset-x-0 bottom-0 z-30
            bg-gradient-to-t from-white via-white to-transparent 
            dark:from-zinc-950 dark:via-zinc-950 dark:to-transparent
            ${isMobile ? 'pb-safe' : ''}
            safe-area-inset-bottom
            transition-all duration-300
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

            {/* Slow Response Warning */}
            {isSlowResponse && status === 'streaming' && (
              <div className="flex justify-center w-full px-4 mb-4">
                <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/20 backdrop-blur-xl border border-yellow-200/80 dark:border-yellow-800/60 shadow-lg rounded-xl px-4 py-3 max-w-md">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="size-2 bg-yellow-500 rounded-full animate-pulse" />
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        AI is taking longer than usual
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        This might be due to high demand. Please wait...
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={stop}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 bg-white dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/70 text-xs px-3 py-1.5 h-auto"
                  >
                    Stop
                  </Button>
                </div>
              </div>
            )}

            {/* Compact Usage Counter */}
            <CompactUsageCounter />

            {/* Global Message Limit Display */}
            <GlobalMessageLimit />

            {/* Rate Limit Message */}
            <RateLimitMessage isVisible={showRateLimitMessage} />

            {/* FIXED: Properly centered input container - aligned with greeting text */}
            <div className="flex justify-center items-center w-full">
              <div
                className={`
                  flex gap-2 w-full max-w-4xl
                  px-4 sm:px-6
                  ${isMobile ? 'pb-4' : 'pb-4'}
                  transition-all duration-300
                  flex-shrink-0
                  mx-auto
                `}
                style={{
                  margin: '0 auto',
                  maxWidth: '64rem', // max-w-4xl equivalent - matches greeting text exactly
                }}
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
                      limitReached={hasReachedLimit}
                      session={session}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
