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
import { Pin, Download } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';

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
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);

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
            }, 150);
          }
        }
      }
    };

    const handleNewChat = (event: CustomEvent) => {
      const { chatId } = event.detail;
      if (chatId === chat.id) {
        setIsGeneratingTitle(true);
        setIsRevealingTitle(false);
        setCurrentTitle('New Thread...');
      }
    };

    const handleTitleGenerated = (event: CustomEvent) => {
      const { chatId, title, isRevealing } = event.detail;
      if (chatId === chat.id && title && title !== 'New Thread...') {
        setIsGeneratingTitle(false);
        setIsRevealingTitle(isRevealing || false);
        setCurrentTitle(title);
      }
    };

    window.addEventListener(
      'chat-status-update',
      handleTitleUpdate as EventListener,
    );
    window.addEventListener('chat-created', handleNewChat as EventListener);
    window.addEventListener(
      'title-generated',
      handleTitleGenerated as EventListener,
    );

    return () => {
      window.removeEventListener(
        'chat-status-update',
        handleTitleUpdate as EventListener,
      );
      window.removeEventListener(
        'chat-created',
        handleNewChat as EventListener,
      );
      window.removeEventListener(
        'title-generated',
        handleTitleGenerated as EventListener,
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
                  transition-opacity duration-300
                  ${isRevealingTitle ? 'opacity-70' : 'opacity-100'}
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

      {/* Rename input overlay */}
      {isRenaming && (
        <div className="absolute inset-0 z-20 bg-background border border-border rounded-lg">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                try {
                  const response = await fetch(`/api/chat/${chat.id}/title`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTitle.trim() }),
                  });

                  if (response.ok) {
                    setCurrentTitle(newTitle.trim());
                    toast.success('Chat renamed successfully!');
                  } else {
                    const error = await response.json();
                    toast.error(error.error || 'Failed to rename chat');
                  }
                } catch (error) {
                  toast.error('Failed to rename chat');
                }
                setIsRenaming(false);
              } else if (e.key === 'Escape') {
                setNewTitle(currentTitle);
                setIsRenaming(false);
              }
            }}
            onBlur={() => {
              setNewTitle(currentTitle);
              setIsRenaming(false);
            }}
            className="w-full h-full px-3 py-2 bg-transparent border-none outline-none text-sm font-medium"
            autoFocus
          />
        </div>
      )}

      {/* Show delete button on hover - improved positioning */}
      {isHovered && !isGeneratingTitle && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction
              className={`
                opacity-100 transition-all duration-200
                hover:bg-sidebar-accent-foreground/10
                data-[state=open]:bg-sidebar-accent-foreground/10
                z-10
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
            className="min-w-[160px] z-50"
            sideOffset={8}
          >
            <DropdownMenuItem
              className="cursor-pointer focus:bg-accent/50"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const response = await fetch(`/api/chat/${chat.id}/pin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                  });

                  if (response.ok) {
                    toast.success('Chat pinned successfully!');
                  } else {
                    const error = await response.json();
                    toast.error(error.error || 'Failed to pin chat');
                  }
                } catch (error) {
                  toast.error('Failed to pin chat');
                }
              }}
            >
              <Pin size={14} />
              <span>Pin</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-accent/50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsRenaming(true);
                setNewTitle(currentTitle);
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-accent/50"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const response = await fetch(`/api/chat/${chat.id}/export`, {
                    method: 'GET',
                  });

                  if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${chat.title || 'chat'}.json`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    toast.success('Chat exported successfully!');
                  } else {
                    const error = await response.json();
                    toast.error(error.error || 'Failed to export chat');
                  }
                } catch (error) {
                  toast.error('Failed to export chat');
                }
              }}
            >
              <Download size={14} />
              <span>Export</span>
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">BETA</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(chat.id);
              }}
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
