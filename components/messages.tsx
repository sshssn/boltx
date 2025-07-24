import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from './greeting';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { X } from 'lucide-react';

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

  useEffect(() => {
    if (isGuest || isRegular || !session?.user) {
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
  }, [isGuest, isRegular, session, messages.length, onGuestLimit]);

  useEffect(() => {
    if (isGuest && messages.length > 0) {
      setShowLimit(true); // Show again on new message
    }
  }, [isGuest, messages.length]);
  useEffect(() => {
    setShowLimit(true); // Show again on new chat
  }, [chatId]);

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
        <div className="sticky" style={{ top: '1%' }}>
          <div className="w-full flex justify-center z-50 transition-all duration-500">
            <div className="bg-white/10 text-xs text-[#FAFAFA] px-4 py-2 rounded-lg shadow border border-white/20 backdrop-blur-md transition-all duration-500">
              {isGuest ? (
                <span>
                  Guest account:{' '}
                  <span className="text-indigo-400 font-bold">
                    {Math.max(0, messagesLimit - messagesUsed)}
                  </span>{' '}
                  messages left.{' '}
                  <a
                    href="/auth"
                    className="underline text-indigo-300 hover:text-indigo-100 transition"
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
                      You have reached your daily quota. Please come back
                      tomorrow or upgrade your plan.
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

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
