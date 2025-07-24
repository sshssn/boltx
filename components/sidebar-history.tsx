'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState, useCallback, useMemo } from 'react';
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

export function getShortTitle(title: string) {
  if (!title?.trim()) return 'Untitled';

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
      short = words.slice(0, 8).join(' ');
    }
  }

  short = short.trim();
  if (!short) short = 'Untitled';

  // Mobile-friendly length limits
  const maxLength = window.innerWidth < 768 ? 28 : 32;
  if (short.length > maxLength) {
    short = `${short.slice(0, maxLength)}...`;
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

// Loading skeleton component
const LoadingSkeleton = () => (
  <SidebarGroup>
    <div className="px-2 py-1 text-xs text-sidebar-foreground/50 font-medium">
      Today
    </div>
    <SidebarGroupContent>
      <div className="flex flex-col space-y-1">
        {[44, 32, 28, 64, 52].map((width, index) => (
          <motion.div
            key={index}
            className="rounded-md h-8 flex gap-2 px-2 items-center"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1,
            }}
          >
            <div
              className="h-4 rounded-md flex-1 bg-sidebar-accent-foreground/10"
              style={{ width: `${width}%` }}
            />
          </motion.div>
        ))}
      </div>
    </SidebarGroupContent>
  </SidebarGroup>
);

// Empty state component
const EmptyState = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <SidebarGroup>
    <SidebarGroupContent>
      <div className="px-3 py-8 text-center">
        <div className="text-sidebar-foreground/60 text-sm leading-relaxed">
          {isLoggedIn
            ? 'Your conversations will appear here once you start chatting!'
            : 'Login to save and revisit previous chats!'}
        </div>
      </div>
    </SidebarGroupContent>
  </SidebarGroup>
);

// Section header component
const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-2 py-1.5 text-xs text-sidebar-foreground/50 font-medium uppercase tracking-wider">
    {children}
  </div>
);

export function SidebarHistory({
  user,
  search,
}: { user: User | undefined; search?: string }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const router = useRouter();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
    error,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/chat?id=${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Optimistic update
      await mutate((chatHistories) => {
        if (chatHistories) {
          return chatHistories.map((chatHistory) => ({
            ...chatHistory,
            chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
          }));
        }
      }, false);

      toast.success('Chat deleted successfully');

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

  const loadMore = useCallback(() => {
    if (!isValidating && !hasReachedEnd) {
      setSize((size) => size + 1);
    }
  }, [isValidating, setSize]);

  // Memoized calculations
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

  const groupedChats = useMemo(
    () => groupChatsByDate(filteredChats),
    [filteredChats],
  );

  // Error state
  if (error) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-3 py-8 text-center">
            <div className="text-red-500 text-sm">
              Failed to load chat history
            </div>
            <button
              onClick={() => mutate()}
              className="mt-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              Try again
            </button>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Empty state
  if (hasEmptyChatHistory) {
    return <EmptyState isLoggedIn={!!user} />;
  }

  const sections = [
    { key: 'today', label: 'Today', chats: groupedChats.today },
    { key: 'yesterday', label: 'Yesterday', chats: groupedChats.yesterday },
    { key: 'lastWeek', label: 'Last 7 days', chats: groupedChats.lastWeek },
    { key: 'lastMonth', label: 'Last 30 days', chats: groupedChats.lastMonth },
    { key: 'older', label: 'Older', chats: groupedChats.older },
  ];

  return (
    <>
      <SidebarGroup className="flex-1 overflow-hidden">
        <SidebarGroupContent className="overflow-y-auto overscroll-contain">
          <SidebarMenu>
            <div className="flex flex-col space-y-4 pb-4">
              {sections.map(
                ({ key, label, chats }) =>
                  chats.length > 0 && (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SectionHeader>{label}</SectionHeader>
                      <div className="space-y-0.5">
                        {chats.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={handleDeleteClick}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ),
              )}
            </div>
          </SidebarMenu>

          {/* Infinite scroll trigger */}
          <motion.div
            className="h-4"
            onViewportEnter={loadMore}
            viewport={{ margin: '100px' }}
          />

          {/* Loading/End state */}
          <div className="px-2 pb-4">
            {hasReachedEnd ? (
              <div className="text-center text-xs text-sidebar-foreground/40 py-4">
                {filteredChats.length > 0
                  ? "You've reached the end"
                  : 'No chats found'}
              </div>
            ) : isValidating ? (
              <div className="flex items-center justify-center gap-2 text-xs text-sidebar-foreground/60 py-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <LoaderIcon size={14} />
                </motion.div>
                Loading more...
              </div>
            ) : null}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Delete conversation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
