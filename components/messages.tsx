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
import { ChevronDown } from 'lucide-react';

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
  limitReached?: boolean;
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
        <ChevronDown className="size-4" />
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
  limitReached = false,
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

  useDataStream();

  // Network error detection removed - handled by chat component

  // Network error detection removed - handled by chat component's ErrorDisplay

  // Retry logic removed - handled by chat component

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

      {/* Network error display removed - handled by chat component */}

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
          limitReached={limitReached}
        />
      ))}

      {/* Glassmorphism typing animation - only show when submitted, not when streaming */}
      {status === 'submitted' && (
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
