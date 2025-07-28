import type { Chat } from '@/lib/db/schema';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { MoreHorizontalIcon, TrashIcon, LoaderIcon } from './icons';
import { memo, useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

// GPT-style title cleaning - more aggressive and smart
const getCleanTitle = (title: string): string => {
  if (!title?.trim()) return 'New Chat';

  // If title is already good, return as is
  if (title.length <= 40 && !title.includes('...')) {
    return title;
  }

  // For longer titles, just do basic truncation
  const maxLength =
    typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 40;

  if (title.length <= maxLength) {
    return title;
  }

  // Simple truncation at word boundary
  const truncated = title.slice(0, maxLength - 3);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > maxLength * 0.7) {
    // Only truncate at space if it's not too early
    return `${truncated.slice(0, lastSpaceIndex)}...`;
  }

  return `${truncated}...`;
};

const LoadingChatItem = ({ isActive }: { isActive: boolean }) => (
  <SidebarMenuItem>
    <SidebarMenuButton asChild isActive={isActive} disabled>
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg">
        <div className="animate-spin text-muted-foreground shrink-0">
          <LoaderIcon size={14} />
        </div>
        <span className="text-sm text-muted-foreground font-medium truncate">
          New Thread...
        </span>
      </div>
    </SidebarMenuButton>
  </SidebarMenuItem>
);

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
  loading = false,
  onMouseEnter,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
  loading?: boolean;
  onMouseEnter?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(chat.title);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isRevealingTitle, setIsRevealingTitle] = useState(false);

  useEffect(() => {
    const handleTitleUpdate = (event: CustomEvent) => {
      const { chatId, title, status, isRevealing } = event.detail;

      if (chatId === chat.id) {
        if (status === 'generating-title') {
          setIsGeneratingTitle(true);
          setIsRevealingTitle(false);
          setCurrentTitle('New Thread...');
        } else if (status === 'completed') {
          setIsGeneratingTitle(false);
          if (title && title !== 'New Thread...') {
            // Start reveal animation
            setIsRevealingTitle(true);

            // Small delay for smooth transition
            setTimeout(() => {
              setCurrentTitle(title);
              setIsRevealingTitle(false);
            }, 200);
          }
        }
      }
    };

    window.addEventListener(
      'chat-status-update',
      handleTitleUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        'chat-status-update',
        handleTitleUpdate as EventListener,
      );
    };
  }, [chat.id]);

  // Show loading state when generating title or explicitly loading
  if (loading || isGeneratingTitle) {
    return <LoadingChatItem isActive={isActive} />;
  }

  const cleanTitle = getCleanTitle(currentTitle);

  return (
    <SidebarMenuItem
      onMouseEnter={() => {
        onMouseEnter?.();
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <SidebarMenuButton asChild isActive={isActive}>
        <Link
          href={`/chat/${chat.id}`}
          onClick={() => setOpenMobile(false)}
          className={`
            flex items-center gap-3 w-full py-2.5 px-3 text-sm rounded-lg
            transition-all duration-200 hover:bg-sidebar-accent/60
            ${
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'
            }
          `}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`
                  truncate font-medium text-sm leading-tight
                  transition-opacity duration-500
                  ${isRevealingTitle ? 'opacity-0' : 'opacity-100'}
                `}
              >
                {cleanTitle}
              </span>
            </TooltipTrigger>
            {currentTitle !== cleanTitle && (
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm">{currentTitle}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </Link>
      </SidebarMenuButton>

      {/* Show delete button on hover - improved positioning */}
      {isHovered && !isGeneratingTitle && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction
              className={`
                opacity-100 transition-opacity duration-200
                hover:bg-sidebar-accent-foreground/10
                data-[state=open]:bg-sidebar-accent-foreground/10
              `}
              showOnHover
            >
              <MoreHorizontalIcon size={14} />
              <span className="sr-only">Chat options</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            className="min-w-[160px]"
          >
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                onDelete(chat.id);
              }}
            >
              <TrashIcon size={14} />
              <span>Delete chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.loading === nextProps.loading &&
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.title === nextProps.chat.title
  );
});
