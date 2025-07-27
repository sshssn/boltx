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
import { MoreHorizontalIcon, TrashIcon, LoaderIcon, PencilEditIcon, CheckCircleFillIcon, CrossIcon } from './icons';
import { memo, useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { toast } from 'sonner';

// Enhanced title processing - ChatGPT style
const getCleanTitle = (title: string): string => {
  if (!title?.trim()) return 'New Chat';

  // Remove common prefixes and clean up
  let cleaned = title
    .replace(/^(Chat|Conversation|Thread|New|Untitled)\s*[-:]?\s*/i, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/^[-•*]\s*/, '')
    .trim();

  if (!cleaned) return 'New Chat';

  // Take first 4-5 words max (ChatGPT style)
  const words = cleaned.split(' ').slice(0, 4);
  cleaned = words.join(' ');

  // Truncate if still too long with smooth ellipsis
  if (cleaned.length > 32) {
    const truncated = cleaned.substring(0, 29);
    const lastSpace = truncated.lastIndexOf(' ');
    cleaned = `${lastSpace > 15 ? truncated.substring(0, lastSpace) : truncated}...`;
  }

  return cleaned;
};

// Beautiful loading component with spinning animation
const LoadingChatItem = ({ isActive }: { isActive: boolean }) => (
  <SidebarMenuItem>
    <SidebarMenuButton asChild isActive={isActive} disabled>
      <div className="flex items-center gap-3 py-2.5 px-3 w-full">
        <div className="animate-spin text-muted-foreground/70">
          <LoaderIcon size={14} />
        </div>
        <span className="text-sm text-muted-foreground animate-pulse">
          New Chat Thread
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
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle title updates from the title manager
  useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent) => {
      const { chatId, status, title } = event.detail;

      if (chatId === chat.id) {
        if (status === 'generating-title') {
          setIsGeneratingTitle(true);
          setCurrentTitle('New Chat Thread');
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

  // Handle rename functionality
  const startRename = () => {
    setIsRenaming(true);
    setRenameValue(currentTitle || '');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameValue('');
  };

  const saveRename = async () => {
    if (!renameValue.trim() || renameValue === currentTitle) {
      cancelRename();
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/chat/${chat.id}/title`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ title: renameValue.trim() }),
      });

      if (response.ok) {
        setCurrentTitle(renameValue.trim());
        setIsRenaming(false);
        setRenameValue('');
        toast.success('Chat renamed successfully');
        
        // Notify other components
        window.dispatchEvent(
          new CustomEvent('chat-renamed', {
            detail: { chatId: chat.id, title: renameValue.trim() },
          }),
        );
      } else {
        throw new Error('Failed to rename chat');
      }
    } catch (error) {
      console.error('Failed to rename chat:', error);
      toast.error('Failed to rename chat');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  // Show loading state during title generation
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
      {isRenaming ? (
        // Rename mode
        <div className="flex items-center gap-2 py-2 px-3 w-full">
          <Input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={saveRename}
            className="h-7 text-sm border-0 bg-sidebar-accent/50 focus:bg-sidebar-accent focus:ring-1 focus:ring-primary/50"
            disabled={isSaving}
          />
          <div className="flex items-center gap-1">
            <button
              onClick={saveRename}
              disabled={isSaving}
              className="p-1 hover:bg-sidebar-accent rounded text-green-600 hover:text-green-700 disabled:opacity-50"
            >
                             {isSaving ? (
                 <LoaderIcon size={12} className="animate-spin" />
               ) : (
                 <CheckCircleFillIcon size={12} />
               )}
            </button>
            <button
              onClick={cancelRename}
              disabled={isSaving}
              className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-foreground"
            >
                             <CrossIcon size={12} />
            </button>
          </div>
        </div>
      ) : (
        // Normal mode
        <>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link
              href={`/chat/${chat.id}`}
              onClick={() => setOpenMobile(false)}
              className="flex items-center gap-3 w-full py-2.5 px-3 text-sm hover:bg-sidebar-accent/50 transition-colors group-hover:pr-8"
            >
              <span className="truncate font-medium leading-tight">
                {cleanTitle}
              </span>
            </Link>
          </SidebarMenuButton>

          {/* Three dots menu - shows on hover */}
          {(isHovered || isActive) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction className="opacity-100 data-[state=open]:opacity-100">
                  <MoreHorizontalIcon size={16} />
                  <span className="sr-only">Chat options</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-48">
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2"
                  onClick={startRename}
                >
                                     <PencilEditIcon size={14} />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive flex items-center gap-2"
                  onClick={() => onDelete(chat.id)}
                >
                  <TrashIcon size={14} />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
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
