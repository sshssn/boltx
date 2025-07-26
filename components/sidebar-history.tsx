'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import type { Chat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { ChatItem } from './sidebar-history-item';
import useSWRInfinite from 'swr/infinite';
import { LoaderIcon } from './icons';
import { useChatCache } from './chat-cache-provider';

export function getShortTitle(title: string) {
  if (!title?.trim()) return 'Untitled';

  // If title is already short and meaningful (like "AI Tech 2025"), return as is
  if (title.length <= 40 && !title.includes('...')) {
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  let short = '';
  const questionIdx = title.indexOf('?');

  if (questionIdx !== -1) {
    short = title.slice(0, questionIdx + 1);
  } else {
    const periodIdx = title.indexOf('.');
    if (periodIdx !== -1) {
      short = title.slice(0, periodIdx + 1);
    } else {
      const words = title
        .replace(/[.?!,:;\-]/g, '')
        .split(' ')
        .filter(Boolean);
      short = words.slice(0, 6).join(' '); // Reduced from 8 to 6 words
    }
  }

  short = short.trim();
  if (!short) short = 'Untitled';

  // Mobile-friendly length limits
  const maxLength =
    typeof window !== 'undefined' && window.innerWidth < 768 ? 28 : 32;
  if (short.length > maxLength) {
    // Find the last complete word to avoid cutting words
    const truncated = short.slice(0, maxLength - 3);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    if (lastSpaceIndex > 0) {
      short = truncated.slice(0, lastSpaceIndex);
    } else {
      short = truncated;
    }
  }

  return short.charAt(0).toUpperCase() + short.slice(1);
}

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export interface ChatHistory {
  chats: Array<Chat>;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory,
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) return `/api/history?limit=${PAGE_SIZE}`;

  const firstChatFromPage = previousPageData.chats.at(-1);
  if (!firstChatFromPage) return null;

  return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

const LoadingSkeleton = () => (
  <SidebarGroup>
    <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
      Today
    </div>
    <SidebarGroupContent>
      <div className="space-y-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-8 bg-muted/50 rounded animate-pulse"
            style={{ width: `${60 + i * 10}%` }}
          />
        ))}
      </div>
    </SidebarGroupContent>
  </SidebarGroup>
);

const EmptyState = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
      <svg
        className="size-6 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </div>
    <p className="text-sm text-muted-foreground mb-2">
      {isLoggedIn ? 'No conversations yet' : 'Start your first conversation'}
    </p>
    <p className="text-xs text-muted-foreground/70">
      {isLoggedIn
        ? 'Your chat history will appear here'
        : 'Sign in to save your conversations'}
    </p>
  </div>
);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
    {children}
  </div>
);

// New Thread Loading Component
const NewThreadLoading = ({ chatId }: { chatId: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent-foreground/5 border border-sidebar-accent-foreground/10 hover:bg-sidebar-accent-foreground/10 transition-all duration-200"
  >
    <div className="flex items-center justify-center size-4 animate-spin">
      <LoaderIcon size={16} />
    </div>
    <span className="text-sm font-medium text-sidebar-foreground/80 truncate">
      New Thread
    </span>
  </motion.div>
);

export function SidebarHistory({
  user,
  search,
}: { user: User | undefined; search?: string }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const router = useRouter();
  const { preloadChat } = useChatCache();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newChats, setNewChats] = useState<Set<string>>(new Set());

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 5000, // Refresh every 5 seconds
  });

  // Listen for new chat creation
  useEffect(() => {
    const handleNewChat = (event: CustomEvent) => {
      const chatId = event.detail?.chatId;
      if (chatId) {
        setNewChats((prev) => new Set(prev).add(chatId));

        // Remove from new chats after 10 seconds
        setTimeout(() => {
          setNewChats((prev) => {
            const updated = new Set(prev);
            updated.delete(chatId);
            return updated;
          });
        }, 10000);
      }
    };

    window.addEventListener('new-chat-created', handleNewChat as EventListener);
    return () => {
      window.removeEventListener(
        'new-chat-created',
        handleNewChat as EventListener,
      );
    };
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/chat?id=${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Update the cache
      await mutate((chatHistories) => {
        if (chatHistories) {
          return chatHistories.map((chatHistory) => ({
            ...chatHistory,
            chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
          }));
        }
      }, false);

      toast.success('Chat deleted');

      if (deleteId === id) {
        router.push('/');
      }
    } catch (error) {
      toast.error('Failed to delete chat');
      console.error('Delete error:', error);
    } finally {
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  }, [deleteId, mutate, id, router]);

  const handleDeleteClick = useCallback((chatId: string) => {
    setDeleteId(chatId);
    setShowDeleteDialog(true);
  }, []);

  // Process chats
  const { hasReachedEnd, hasEmptyChatHistory, filteredChats } = useMemo(() => {
    const hasReachedEnd = paginatedChatHistories
      ? paginatedChatHistories.some((page) => page.hasMore === false)
      : false;

    const hasEmptyChatHistory = paginatedChatHistories
      ? paginatedChatHistories.every((page) => page.chats.length === 0)
      : false;

    let chatsFromHistory =
      paginatedChatHistories?.flatMap(
        (paginatedChatHistory) => paginatedChatHistory.chats,
      ) || [];

    // Filter by search if provided
    if (search?.trim()) {
      const query = search.trim().toLowerCase();
      chatsFromHistory = chatsFromHistory.filter((chat) =>
        chat.title.toLowerCase().includes(query),
      );
    }

    return {
      hasReachedEnd,
      hasEmptyChatHistory,
      filteredChats: chatsFromHistory,
    };
  }, [paginatedChatHistories, search]);

  const loadMore = useCallback(() => {
    if (!isValidating && !hasReachedEnd) {
      setSize((size) => size + 1);
    }
  }, [isValidating, hasReachedEnd, setSize]);

  // Loading state
  if (isLoading && !paginatedChatHistories?.length) {
    return <LoadingSkeleton />;
  }

  // Empty state
  if (hasEmptyChatHistory && !search?.trim()) {
    return <EmptyState isLoggedIn={!!user?.id} />;
  }

  // Group chats by date
  const groupedChats = groupChatsByDate(filteredChats);

  // Show new thread loading if current chat is new
  const showNewThreadLoading = id && newChats.has(id as string);

  return (
    <>
      <div className="flex flex-col space-y-1">
        {/* Show new thread loading at the top if current chat is new */}
        {/* DISABLED: New Thread animation - removed due to user request */}
        {/* {showNewThreadLoading && (
          <SidebarGroup>
            <SectionHeader>Today</SectionHeader>
            <SidebarGroupContent>
              <NewThreadLoading chatId={id as string} />
            </SidebarGroupContent>
          </SidebarGroup>
        )} */}

        {/* Today */}
        {groupedChats.today.length > 0 && (
          <SidebarGroup>
            <SectionHeader>Today</SectionHeader>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedChats.today.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={handleDeleteClick}
                    setOpenMobile={setOpenMobile}
                    onMouseEnter={() => preloadChat(chat.id)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Yesterday */}
        {groupedChats.yesterday.length > 0 && (
          <SidebarGroup>
            <SectionHeader>Yesterday</SectionHeader>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedChats.yesterday.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={handleDeleteClick}
                    setOpenMobile={setOpenMobile}
                    onMouseEnter={() => preloadChat(chat.id)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Last 7 days */}
        {groupedChats.lastWeek.length > 0 && (
          <SidebarGroup>
            <SectionHeader>Last 7 days</SectionHeader>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedChats.lastWeek.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={handleDeleteClick}
                    setOpenMobile={setOpenMobile}
                    onMouseEnter={() => preloadChat(chat.id)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Last 30 days */}
        {groupedChats.lastMonth.length > 0 && (
          <SidebarGroup>
            <SectionHeader>Last 30 days</SectionHeader>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedChats.lastMonth.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={handleDeleteClick}
                    setOpenMobile={setOpenMobile}
                    onMouseEnter={() => preloadChat(chat.id)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Older */}
        {groupedChats.older.length > 0 && (
          <SidebarGroup>
            <SectionHeader>Older</SectionHeader>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedChats.older.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={handleDeleteClick}
                    setOpenMobile={setOpenMobile}
                    onMouseEnter={() => preloadChat(chat.id)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Load more */}
        {!hasReachedEnd && (
          <div className="p-2">
            <button
              type="button"
              onClick={loadMore}
              disabled={isValidating}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {isValidating ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the conversation and all messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
