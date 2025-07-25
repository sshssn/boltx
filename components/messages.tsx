import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from './greeting';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { useSession } from 'next-auth/react';
import {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from 'react';
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
import { ChevronDown } from 'lucide-react';
import React from 'react';

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

// Add ScrollToBottomButton component
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
        className="flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg hover:bg-white/15 hover:scale-105 transition-all duration-200 ease-out text-white/90 text-sm font-medium"
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
  const [messagesLimit, setMessagesLimit] = useState<number>(isGuest ? 10 : 20);
  const [showLimit, setShowLimit] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(
    undefined,
  );
  const [showSignupModal, setShowSignupModal] = useState(false);

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

  // Refetch quota info after every user message send
  useEffect(() => {
    if (isGuest || isRegular || !session?.user) {
      // Only refetch if the last message is from the user (to avoid double fetch on system/assistant messages)
      if (
        messages.length === 0 ||
        messages[messages.length - 1].role !== 'user'
      )
        return;
      fetch('/api/profile/tokens').then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setMessagesUsed(data.tokensUsed ?? messages.length);
          setMessagesLimit(
            data.messagesLimit ?? (isGuest ? 10 : isRegular ? 20 : 10),
          );
          if (onGuestLimit)
            onGuestLimit(
              data.messagesLimit ?? 10,
              data.tokensUsed ?? messages.length,
            );
        }
      });
    }
  }, [isGuest, isRegular, session, messages, onGuestLimit]);

  useEffect(() => {
    if (isGuest && messages.length > 0) {
      setShowLimit(true); // Show again on new message
    }
  }, [isGuest, messages.length]);
  useEffect(() => {
    setShowLimit(true); // Show again on new chat
  }, [chatId]);

  useEffect(() => {
    if (isGuest && messagesLimit - messagesUsed <= 0) {
      setShowSignupModal(true);
    }
  }, [isGuest, messagesLimit, messagesUsed]);

  useDataStream();

  return (
    <div
      ref={chatContainerRef}
      className={`flex flex-col overflow-y-auto relative w-full flex-1${extraPaddingBottom ? ' pb-32' : ''}`}
    >
      {messages.length === 0 && <Greeting />}

      {/* Guest user message limit warning: absolutely centered at top of chat container, not viewport */}
      {/*
      {isGuest && messages.length > 0 && showLimit && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 w-auto mx-auto flex justify-center pointer-events-none">
          <div className="flex items-center gap-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 shadow-lg rounded-xl text-sm font-medium px-4 py-2 m-2 w-auto pointer-events-auto">
            <span className="text-zinc-900 dark:text-white whitespace-nowrap">
              You're down to{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {Math.max(0, messagesLimit - messagesUsed)}
              </span>{' '}
              messages—
              <a
                href="/auth"
                className="underline text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sign up
              </a>
              &nbsp;and we will increase your limits!{' '}
              <span role="img" aria-label="smile">
                😊
              </span>
            </span>
            <button
              type="button"
              className="ml-2 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              onClick={() => setShowLimit(false)}
              aria-label="Dismiss message limit warning"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      */}

      {/* Show quota message for both guests and regular users */}
      {showLimit && (isGuest || isRegular) && (
        <div className="absolute left-1/2 top-6 -translate-x-1/2 z-[1000] w-auto flex justify-center pointer-events-none">
          <div className="flex items-center gap-3 bg-[#4B5DFE]/30 dark:bg-zinc-900/70 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 shadow-2xl rounded-xl text-base font-semibold px-5 py-2 m-2 w-auto pointer-events-auto animate-fade-in">
            {isGuest ? (
              <span className="text-zinc-900 dark:text-white whitespace-nowrap">
                Guest account:{' '}
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {Math.max(0, messagesLimit - messagesUsed)}
                </span>{' '}
                messages left.{' '}
                <a
                  href="/auth"
                  className="underline text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sign up to chat, we will increase your limits — it&apos;s
                  free!
                </a>
              </span>
            ) : (
              <span>
                {`You have used ${messagesUsed} of ${messagesLimit} messages today. ${messagesLimit - messagesUsed} remaining.`}
                {messagesLimit - messagesUsed <= 2 &&
                  messagesLimit - messagesUsed > 0 && (
                    <span className="text-pink-400 ml-2">
                      You&apos;re almost out of messages for today!
                    </span>
                  )}
                {messagesLimit - messagesUsed <= 0 && (
                  <span className="text-pink-400 ml-2">
                    You have reached your daily quota. Please come back tomorrow
                    or upgrade your plan.
                  </span>
                )}
              </span>
            )}
            <button
              type="button"
              className="ml-2 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              onClick={() => setShowLimit(false)}
              aria-label="Dismiss message limit warning"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4l8 8m0-8l-8 8"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* Modal for sign up when limit is reached */}
      <AlertDialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Message Limit Reached</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve reached your daily limit of {messagesLimit} messages
              as a guest. Sign up for a free account to continue chatting and
              unlock more features!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Button asChild variant="default" size="lg">
                <a href="/auth">Sign Up Free</a>
              </Button>
            </AlertDialogAction>
            <AlertDialogCancel asChild>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setShowSignupModal(false)}
              >
                Maybe Later
              </Button>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      <div ref={messagesEndRef} />
      <ScrollToBottomButton
        chatContainerRef={chatContainerRef}
        className="fixed bottom-28 right-8 z-[1001]"
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
