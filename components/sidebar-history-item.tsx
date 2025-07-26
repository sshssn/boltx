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

// Simple, clean title processing - GPT style
const getCleanTitle = (title: string): string => {
  if (!title?.trim()) return 'New Chat';

  // Remove common prefixes
  let cleaned = title
    .replace(/^(Chat|Conversation|Thread|New|Untitled)\s*[-:]?\s*/i, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/^[-•*]\s*/, '')
    .trim();

  if (!cleaned) return 'New Chat';

  // Take first 4-5 words max (GPT style)
  const words = cleaned.split(' ').slice(0, 4);
  cleaned = words.join(' ');

  // Truncate if still too long
  if (cleaned.length > 35) {
    const truncated = cleaned.substring(0, 32);
    const lastSpace = truncated.lastIndexOf(' ');
    cleaned = `${lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated}...`;
  }

  return cleaned;
};

const LoadingChatItem = ({ isActive }: { isActive: boolean }) => (
  <SidebarMenuItem>
    <SidebarMenuButton asChild isActive={isActive} disabled>
      <div className="flex items-center gap-2 py-2 px-3">
        <div className="animate-spin text-muted-foreground">
          <LoaderIcon size={16} />
        </div>
        <span className="text-sm text-muted-foreground">New Thread</span>
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

  useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent) => {
      const { chatId, status, title } = event.detail;

      if (chatId === chat.id) {
        if (status === 'generating-title') {
          setIsGeneratingTitle(true);
          setCurrentTitle('New Thread');
        } else if (status === 'completed') {
          setIsGeneratingTitle(false);
          setCurrentTitle(title);
        }
      }
    };

    window.addEventListener(
      'chat-status-update',
      handleStatusUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        'chat-status-update',
        handleStatusUpdate as EventListener,
      );
    };
  }, [chat.id]);

  // Check if this is a new chat (no real title yet)
  const isNewChat =
    !chat.title || chat.title === 'New Chat' || isGeneratingTitle;

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
      className="group"
    >
      <SidebarMenuButton asChild isActive={isActive}>
        <Link
          href={`/chat/${chat.id}`}
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-2 w-full py-2 px-3 text-sm hover:bg-sidebar-accent/50 transition-colors"
        >
          <span className="truncate font-medium">{cleanTitle}</span>
        </Link>
      </SidebarMenuButton>

      {/* Show delete button on hover */}
      {isHovered && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction className="opacity-100">
              <MoreHorizontalIcon size={16} />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
              onClick={() => onDelete(chat.id)}
            >
              <TrashIcon size={14} />
              <span>Delete</span>
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
