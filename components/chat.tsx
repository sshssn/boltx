// @ts-nocheck
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useState, useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import type { Session } from 'next-auth';
import type { Attachment, ChatMessage } from '@/lib/types';
import { SuggestedActions } from './suggested-actions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from 'usehooks-ts';
import { toast } from 'sonner';
import { useMessageLimit } from '@/components/message-limit-provider';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showLoginToast } from '@/components/auth-toast';
import { ChatTitleManager } from './chat-title-manager';
import { GlobalMessageLimit } from '@/components/global-message-limit';
import { CompactUsageCounter } from '@/components/compact-usage-counter';
import { RateLimitMessage } from '@/components/rate-limit-message';
import { LoaderIcon } from './icons';
import { useDataStream } from './data-stream-provider';
import { MemoryPill } from './memory-pill';

interface ChatProps {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}

function ErrorDisplay({
  error,
  onRetry,
  isRetrying,
}: { error: any; onRetry: () => void; isRetrying?: boolean }) {
  const getErrorMessage = (error: any) => {
    if (error?.status === 429) return 'Rate limit exceeded. Please try again in a moment.';
    if (error?.status === 403) return 'Access denied. Please check your API configuration.';
    if (error?.status >= 500) return 'Server error. Our team has been notified.';
    return 'Connection failed. Please check your internet and try again.';
  };

  return (
    <div className="flex justify-center w-full px-4 mb-4">
      <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 backdrop-blur-xl border border-red-200/80 dark:border-red-800/60 shadow-lg rounded-xl px-4 py-3 max-w-md">
        <div className="flex items-center gap-2 flex-1">
          <AlertTriangle className="size-5 text-red-600 dark:text-red-400 shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Failed to get response from AI</p>
            <p className="text-xs text-red-700 dark:text-red-300">{getErrorMessage(error)}</p>
          </div>
        </div>
        <Button onClick={onRetry} disabled={isRetrying} size="sm" variant="outline" className="flex items-center gap-1 bg-white dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/70 text-xs px-3 py-1.5 h-auto disabled:opacity-50">
          {isRetrying ? <><RefreshCw className="size-3 animate-spin" />Retrying...</> : <><RefreshCw className="size-3" />Retry</>}
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
  const { state } = useSidebar();
  const { setDataStream } = useDataStream();
  const { mutate } = useSWRConfig();
  const { data: authSession } = useSession();
  const isRegularUser = authSession?.user?.type === 'regular';

  const [lastError, setLastError] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSlowResponse, setIsSlowResponse] = useState(false);
  const [currentTitle, setCurrentTitle] = useState<string>('New Chat');
  const [isTitleGenerating, setIsTitleGenerating] = useState<boolean>(false);
  const [showRateLimitMessage, setShowRateLimitMessage] = useState(false);

  const {
    messages,
    setMessages,
    handleSubmit,
    status,
    stop,
    append,
    reload,
    error,
    input,
    setInput,
  } = useChat<ChatMessage>({
    id,
    initialMessages,
    experimental_throttle: 0,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        id,
        selectedChatModel: initialChatModel,
        selectedVisibilityType: initialVisibilityType,
      },
      fetch: fetchWithErrorHandlers,
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setLastError(error);
    },
    onFinish: (message) => {
      mutate('/api/history');
    },
  });
  const safeMessages = Array.isArray(messages) ? messages : [];

  useEffect(() => {
    if (session?.user && document.referrer.includes('/auth')) {
      showLoginToast();
    }
  }, [session?.user]);

  const [_, copyToClipboard] = useCopyToClipboard();
  const [isArtifactVisible, setIsArtifactVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (status === 'streaming') {
      timeoutId = setTimeout(() => setIsSlowResponse(true), 30000);
    } else {
      setIsSlowResponse(false);
    }
    return () => timeoutId && clearTimeout(timeoutId);
  }, [status]);

  const handleRetry = () => {
    setLastError(null);
    setIsRetrying(true);
    reload().finally(() => setIsRetrying(false));
  };

  const handleNewMessage = async (message: string, attachments?: Attachment[]) => {
    setLastError(null);
    await append({ role: 'user', content: message, experimental_attachments: attachments });
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background overflow-hidden relative">
      <ChatHeader
        chatId={id}
        selectedModelId={initialChatModel}
        selectedVisibilityType={initialVisibilityType}
        isReadonly={isReadonly}
      />
      
      {isRegularUser && (
        <div className="w-full flex justify-center mt-2 mb-2 z-50">
          <MemoryPill />
        </div>
      )}

      {safeMessages.length > 0 && (
        <ChatTitleManager
          chatId={id}
          userMessage={safeMessages.find((m) => m.role === 'user')?.content || ''}
          aiResponse={safeMessages.find((m) => m.role === 'assistant')?.content}
          isStreaming={status === 'streaming'}
        />
      )}

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {safeMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4 pb-36">
            <div className="w-full max-w-2xl">
              <SuggestedActions
                chatId={id}
                append={append}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-36 scroll-smooth">
            <Messages
              chatId={id}
              status={status}
              messages={safeMessages}
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
              isArtifactVisible={isArtifactVisible}
            />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-white via-white to-transparent dark:from-zinc-950 dark:via-zinc-950 dark:to-transparent">
          {lastError && <ErrorDisplay error={lastError} onRetry={handleRetry} isRetrying={isRetrying} />}
          
          <CompactUsageCounter />
          <GlobalMessageLimit />
          <RateLimitMessage isVisible={showRateLimitMessage} />

          <div className="flex justify-center w-full pb-4">
            <div className="w-full max-w-4xl mx-auto px-4">
              <MultimodalInput
                chatId={id}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={status === 'streaming'}
                stop={stop}
                messages={safeMessages}
                setMessages={setMessages}
                append={append}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
