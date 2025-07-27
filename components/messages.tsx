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
  isVisible,
}: {
  chatContainerRef: React.RefObject<HTMLDivElement>;
  className?: string;
  isVisible: boolean;
}) {
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToBottom}
      size="sm"
      variant="outline"
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10 rounded-full shadow-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border-zinc-200/50 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-200 ${className}`}
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  );
}

export const Messages = memo((props: MessagesProps) => {
  const {
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
  } = props;

  const { data: session } = useSession();
  const isGuest = session?.user?.type === 'guest';
  const isRegular = session?.user?.type === 'regular';

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Enhanced state management for better error tracking
  const [messagesUsed, setMessagesUsed] = useState<number>(0);
  const [messagesLimit, setMessagesLimit] = useState<number>(isGuest ? 20 : 50);
  const [networkError, setNetworkError] = useState(false);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState<number>(Date.now());
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  // Enhanced error detection function
  const isMessageEmpty = useCallback((message: ChatMessage): boolean => {
    if (!message.parts || message.parts.length === 0) return true;
    
    // Check if all parts are empty
    const hasContent = message.parts.some(part => {
      if (part.type === 'text') {
        return part.text && part.text.trim().length > 0;
      }
      // For other part types, assume they have content if they exist
      return true;
    });
    
    return !hasContent;
  }, []);

  // Enhanced network error detection
  const detectNetworkErrors = useCallback(() => {
    const lastMessage = messages[messages.length - 1];
    
    // Check for empty assistant messages
    if (lastMessage?.role === 'assistant' && isMessageEmpty(lastMessage)) {
      console.log('Detected empty assistant message');
      return true;
    }
    
    // Check for messages that only contain whitespace or minimal content
    if (lastMessage?.role === 'assistant' && lastMessage.parts) {
      const textContent = lastMessage.parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('')
        .trim();
      
      // Consider very short responses as potential errors (less than 3 characters)
      if (textContent.length > 0 && textContent.length < 3) {
        console.log('Detected suspiciously short response:', textContent);
        return true;
      }
    }
    
    return false;
  }, [messages, isMessageEmpty]);

  // Track message timing for timeout detection
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessageTime(Date.now());
    }
  }, [messages.length]);

  // Enhanced error detection with multiple triggers
  useEffect(() => {
    // Clear any existing error state when messages change (unless it's an error case)
    if (!detectNetworkErrors()) {
      setNetworkError(false);
      if (errorTimeout) {
        clearTimeout(errorTimeout);
        setErrorTimeout(null);
      }
    } else {
      setNetworkError(true);
    }
  }, [messages, detectNetworkErrors, errorTimeout]);

  // Enhanced timeout-based error detection
  useEffect(() => {
    if (status === 'submitted' || status === 'streaming') {
      setIsWaitingForResponse(true);
      
      // Clear any existing timeout
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
      
      // Set a new timeout for detecting unresponsive AI
      const timeoutId = setTimeout(() => {
        console.log('AI response timeout detected');
        setNetworkError(true);
        setIsWaitingForResponse(false);
      }, 45000); // Increased to 45 seconds for better reliability
      
      setErrorTimeout(timeoutId);
    } else {
      setIsWaitingForResponse(false);
      if (errorTimeout) {
        clearTimeout(errorTimeout);
        setErrorTimeout(null);
      }
    }

    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [status]);

  // Monitor for stuck streaming states
  useEffect(() => {
    if (status === 'streaming') {
      const lastActivity = Date.now();
      
      const checkStreamingTimeout = setTimeout(() => {
        // If we've been streaming for too long without new content, show error
        if (status === 'streaming' && Date.now() - lastActivity > 30000) {
          console.log('Streaming timeout detected');
          setNetworkError(true);
        }
      }, 30000);
      
      return () => clearTimeout(checkStreamingTimeout);
    }
  }, [status, lastMessageTime]);

  // Fetch usage data with better error handling
  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/profile/tokens', {
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (res.ok) {
          const data = await res.json();
          const serverUsed = data.tokensUsed ?? 0;
          const serverLimit =
            data.messagesLimit ?? (isGuest ? 20 : isRegular ? 50 : 20);
          setMessagesUsed(serverUsed);
          setMessagesLimit(serverLimit);
        } else {
          console.warn('Failed to fetch usage data:', res.status);
        }
      } catch (error) {
        console.error('Error fetching usage data:', error);
      }
    }

    // Only fetch for logged-in users
    if (session?.user?.id) {
      fetchUsage();
    }
  }, [session, isGuest, isRegular]);

  // Enhanced guest limit detection
  useEffect(() => {
    if ((isGuest || isRegular) && messagesUsed >= messagesLimit) {
      onGuestLimit?.(messagesLimit, messagesUsed);
    }
  }, [isGuest, isRegular, messagesUsed, messagesLimit, onGuestLimit]);

  useDataStream();

  // Enhanced retry handler
  const handleRetry = useCallback(() => {
    console.log('Handling retry...');
    setNetworkError(false);
    setIsWaitingForResponse(false);
    
    if (errorTimeout) {
      clearTimeout(errorTimeout);
      setErrorTimeout(null);
    }
    
    // Remove the last assistant message if it's empty/broken
    setMessages((prev) => {
      const lastAssistantIndex = prev.findLastIndex(
        (msg) => msg.role === 'assistant',
      );
      
      if (lastAssistantIndex !== -1) {
        const lastAssistant = prev[lastAssistantIndex];
        if (isMessageEmpty(lastAssistant)) {
          console.log('Removing empty assistant message');
          return prev.slice(0, lastAssistantIndex);
        }
      }
      return prev;
    });
    
    // Small delay before regenerating to ensure state is clean
    setTimeout(() => {
      regenerate();
    }, 100);
  }, [setMessages, regenerate, isMessageEmpty, errorTimeout]);

  // Scroll detection for show/hide scroll button
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && scrollHeight > clientHeight);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom for new messages
  useLayoutEffect(() => {
    const container = chatContainerRef.current;
    if (container && !showScrollButton) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, showScrollButton]);

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
        <div className="flex justify-center p-4 sticky top-0 z-10">
          <NetworkError
            onRetry={handleRetry}
            message={
              isWaitingForResponse 
                ? "AI is taking too long to respond" 
                : "Failed to get response from AI"
            }
          />
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={
            status === 'submitted' ||
            (status === 'streaming' && index === messages.length - 1)
          }
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />
      ))}

      {/* Guest Message Limit Display */}
      {(isGuest || isRegular) && messages.length > 0 && (
        <div className="flex justify-center w-full px-3 mb-4">
          <div className="flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xl rounded-xl text-sm font-medium px-4 py-3 transition-all duration-200 hover:bg-white dark:hover:bg-zinc-900">
            <span className="text-zinc-700 dark:text-zinc-300">
              You&apos;ve used{' '}
              <strong className="text-blue-600 dark:text-blue-400">
                {messagesUsed}
              </strong>{' '}
              of{' '}
              <strong className="text-blue-600 dark:text-blue-400">
                {messagesLimit}
              </strong>{' '}
              messages as a{' '}
              <strong>{isGuest ? 'guest' : 'free'}</strong> user today
            </span>
            <a
              href={isGuest ? '/auth' : '/account'}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors duration-200 font-medium ml-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {isGuest ? 'Sign up free' : 'Upgrade'}
              <Sparkles className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      <ScrollToBottomButton
        chatContainerRef={chatContainerRef}
        isVisible={showScrollButton}
      />
    </div>
  );
}, equal);

Messages.displayName = 'Messages';
