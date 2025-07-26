import { PreviewMessage } from './message';
import { Greeting } from './greeting';
import {
  memo,
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
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
import { ChevronDown, Sparkles } from 'lucide-react';
import { NetworkError } from './network-error';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  votes: Array<Vote> | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  extraPaddingBottom?: boolean;
  onGuestLimit?: (limit: number, used: number) => void;
}

// Simple Thinking Dots Component

// Enhanced ScrollToBottomButton component
function ScrollToBottomButton({
  chatContainerRef,
  className = '',
}: { chatContainerRef: React.RefObject<HTMLElement>; className?: string }) {
  const [showScrollButton, setShowScrollButton] = useState(false);

  const checkScrollPosition = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollButton(!isAtBottom);
    }
  }, [chatContainerRef]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      return () =>
        chatContainer.removeEventListener('scroll', checkScrollPosition);
    }
  }, [chatContainerRef, checkScrollPosition]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        showScrollButton
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
      } ${className}`}
    >
      <button
        type="button"
        onClick={scrollToBottom}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-white/30 dark:border-zinc-700/50 rounded-xl shadow-lg hover:bg-white/95 dark:hover:bg-zinc-800/95 hover:scale-105 transition-all duration-200 ease-out text-zinc-700 dark:text-zinc-300 text-sm font-medium"
        aria-label="Scroll to bottom"
      >
        <span>Scroll to bottom</span>
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  isArtifactVisible,
  extraPaddingBottom,
  onGuestLimit,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
    isAtBottom,
  } = useMessages({
    chatId,
    status,
  });

  const { data: session } = useSession();
  const isGuest = session?.user?.type === 'guest';
  const isRegular = session?.user?.type === 'regular';
  const [messagesUsed, setMessagesUsed] = useState<number>(0);
  const [messagesLimit, setMessagesLimit] = useState<number>(isGuest ? 20 : 50);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(
    undefined,
  );
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useLayoutEffect(() => {
    if (chatContainerRef.current) {
      setContainerWidth(chatContainerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (chatContainerRef.current) {
        setContainerWidth(chatContainerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fixed: Proper message limit tracking that persists across chats
  useEffect(() => {
    if (isGuest || isRegular || !session?.user) {
      // Fetch quota info on component mount and when messages change
      const fetchQuotaInfo = async () => {
        try {
          const response = await fetch('/api/profile/tokens');
          if (response.ok) {
            const data = await response.json();
            // Use server data as source of truth
            const serverUsed = data.tokensUsed ?? 0;
            const serverLimit =
              data.messagesLimit ?? (isGuest ? 20 : isRegular ? 50 : 20);

            setMessagesUsed(serverUsed);
            setMessagesLimit(serverLimit);

            if (onGuestLimit) {
              onGuestLimit(serverLimit, serverUsed);
            }
          }
        } catch (error) {
          console.error('Failed to fetch quota info:', error);
          // Fallback to counting messages if API fails
          const userMessageCount = messages.filter(
            (msg) => msg.role === 'user',
          ).length;
          setMessagesUsed(userMessageCount);
        }
      };

      fetchQuotaInfo();

      // Also fetch when a new user message is added
      const userMessages = messages.filter((msg) => msg.role === 'user');
      if (userMessages.length > 0) {
        // Small delay to ensure the message is processed on the server
        const timeoutId = setTimeout(fetchQuotaInfo, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isGuest, isRegular, session, messages.length, onGuestLimit]);

  // Show signup modal when limit is reached
  useEffect(() => {
    if ((isGuest || isRegular) && messagesUsed >= messagesLimit) {
      setShowSignupModal(true);
    }
  }, [isGuest, isRegular, messagesUsed, messagesLimit]);

  useDataStream();

  // Check for network errors in messages
  useEffect(() => {
    const hasNetworkError = messages.some(
      (msg) =>
        msg.role === 'assistant' &&
        (!msg.parts ||
          msg.parts.length === 0 ||
          (msg.parts.length === 1 &&
            msg.parts[0].type === 'text' &&
            (!msg.parts[0].text || msg.parts[0].text.trim() === ''))),
    );
    setNetworkError(hasNetworkError);
  }, [messages, setNetworkError]);

  // Additional timeout-based error detection for when AI doesn't respond
  useEffect(() => {
    if (status === 'submitted' || status === 'streaming') {
      const timeoutId = setTimeout(() => {
        // If we're still in submitted/streaming state after 30 seconds, show error
        if (status === 'submitted' || status === 'streaming') {
          setNetworkError(true);
        }
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeoutId);
    }
  }, [status]);

  const handleRetry = () => {
    setNetworkError(false);
    // Remove the last assistant message if it's empty/broken
    setMessages((prev) => {
      const lastAssistantIndex = prev.findLastIndex(
        (msg) => msg.role === 'assistant',
      );
      if (lastAssistantIndex !== -1) {
        const lastAssistant = prev[lastAssistantIndex];
        if (
          !lastAssistant.parts ||
          lastAssistant.parts.length === 0 ||
          (lastAssistant.parts.length === 1 &&
            lastAssistant.parts[0].type === 'text' &&
            (!lastAssistant.parts[0].text ||
              lastAssistant.parts[0].text.trim() === ''))
        ) {
          return prev.slice(0, lastAssistantIndex);
        }
      }
      return prev;
    });
    // Regenerate the response
    regenerate();
  };

  return (
    <div
      ref={chatContainerRef}
      className={`flex flex-col overflow-y-auto relative w-full flex-1 ${
        extraPaddingBottom ? 'pb-32' : ''
      }`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgb(156 163 175) transparent',
      }}
    >
      {messages.length === 0 && <Greeting />}

      {/* Enhanced Network Error Display */}
      {networkError && (
        <div className="flex justify-center px-4 py-4">
          <NetworkError
            onRetry={handleRetry}
            message="Failed to get response from AI"
          />
        </div>
      )}

      {/* Enhanced Signup Modal */}
      <AlertDialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <AlertDialogContent className="max-w-md border-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Message Limit Reached
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-zinc-600 dark:text-zinc-400">
              You&apos;ve reached your daily limit of{' '}
              <strong>{messagesLimit}</strong> messages as a{' '}
              {isGuest ? 'guest' : 'registered user'}.
              {isGuest
                ? ' Sign up for a free account to continue chatting and unlock more features!'
                : ' Upgrade to Pro for unlimited messages and advanced features!'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogAction asChild className="w-full">
              <Button
                asChild
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                size="lg"
              >
                <a
                  href={isGuest ? '/auth' : '/billing'}
                  className="flex items-center gap-2"
                >
                  {isGuest ? 'Sign Up Free' : 'Upgrade to Pro'}
                  <Sparkles className="w-4 h-4" />
                </a>
              </Button>
            </AlertDialogAction>
            <AlertDialogCancel asChild className="w-full">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setShowSignupModal(false)}
                className="text-zinc-600 dark:text-zinc-400"
              >
                Maybe Later
              </Button>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Messages */}
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === 'streaming' && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
          requiresScrollPadding={
            hasSentMessage && index === messages.length - 1
          }
          isStreaming={status === 'streaming' && index === messages.length - 1}
          style={index === 0 ? { marginTop: '1.2rem' } : {}}
        />
      ))}

      {/* Glassmorphism typing animation */}
      {(status === 'streaming' || status === 'submitted') && (
        <div className="w-full mx-auto max-w-3xl px-4 group/message my-6">
          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-row gap-2 items-start">
                <div
                  data-testid="message-content"
                  className="flex flex-col gap-4 w-full"
                >
                  {/* Simple animated dots - no full width container */}
                  <div className="flex items-center gap-1 md:gap-1.5">
                    <div
                      className="w-2 h-2 md:w-2.5 md:h-2.5 bg-zinc-600 dark:bg-zinc-300 rounded-full animate-bounce"
                      style={{
                        animationDelay: '0ms',
                        animationDuration: '1.4s',
                      }}
                    />
                    <div
                      className="w-2 h-2 md:w-2.5 md:h-2.5 bg-zinc-600 dark:bg-zinc-300 rounded-full animate-bounce"
                      style={{
                        animationDelay: '200ms',
                        animationDuration: '1.4s',
                      }}
                    />
                    <div
                      className="w-2 h-2 md:w-2.5 md:h-2.5 bg-zinc-600 dark:bg-zinc-300 rounded-full animate-bounce"
                      style={{
                        animationDelay: '400ms',
                        animationDuration: '1.4s',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />

      {/* Enhanced Scroll to Bottom Button */}
      <ScrollToBottomButton
        chatContainerRef={chatContainerRef}
        className="fixed bottom-32 right-6 z-[1001]"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return false;
});
