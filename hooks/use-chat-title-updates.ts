import { useEffect } from 'react';
import { mutate } from 'swr';

export function useChatTitleUpdates() {
  useEffect(() => {
    // Listen for new chat creation
    const handleNewChat = (event: CustomEvent) => {
      const { chatId } = event.detail;

      // Dispatch event to show "New Thread..." in sidebar immediately
      window.dispatchEvent(
        new CustomEvent('chat-status-update', {
          detail: {
            chatId,
            status: 'generating-title',
            title: 'New Thread...',
          },
        }),
      );

      // Update the chat history cache immediately
      mutate(
        (key) => typeof key === 'string' && key.includes('/api/history'),
        (data: any) => {
          if (!data) return data;

          // Handle different data structures
          if (Array.isArray(data)) {
            return data.map((page: any) => ({
              ...page,
              chats:
                page.chats?.map((chat: any) =>
                  chat.id === chatId
                    ? { ...chat, title: 'New Thread...' }
                    : chat,
                ) || [],
            }));
          } else if (data.chats && Array.isArray(data.chats)) {
            // Handle single page structure
            return {
              ...data,
              chats: data.chats.map((chat: any) =>
                chat.id === chatId ? { ...chat, title: 'New Thread...' } : chat,
              ),
            };
          }

          return data;
        },
        { revalidate: false },
      );
    };

    // Listen for title generation completion
    const handleTitleGenerated = (event: CustomEvent) => {
      const { chatId, title, isRevealing } = event.detail;

      // Update the chat history cache immediately
      mutate(
        (key) => typeof key === 'string' && key.includes('/api/history'),
        (data: any) => {
          if (!data) return data;

          // Handle different data structures
          if (Array.isArray(data)) {
            return data.map((page: any) => ({
              ...page,
              chats:
                page.chats?.map((chat: any) =>
                  chat.id === chatId ? { ...chat, title } : chat,
                ) || [],
            }));
          } else if (data.chats && Array.isArray(data.chats)) {
            // Handle single page structure
            return {
              ...data,
              chats: data.chats.map((chat: any) =>
                chat.id === chatId ? { ...chat, title } : chat,
              ),
            };
          }

          return data;
        },
        { revalidate: false },
      );

      // Notify sidebar components immediately
      window.dispatchEvent(
        new CustomEvent('chat-status-update', {
          detail: {
            chatId,
            status: 'completed',
            title,
            isRevealing,
          },
        }),
      );
    };

    // Listen for the new threadTitleUpdated event from improved title generation
    const handleThreadTitleUpdated = (event: CustomEvent) => {
      const { threadId, title } = event.detail;

      // Update the chat history cache immediately
      mutate(
        (key) => typeof key === 'string' && key.includes('/api/history'),
        (data: any) => {
          if (!data) return data;

          // Handle different data structures
          if (Array.isArray(data)) {
            return data.map((page: any) => ({
              ...page,
              chats:
                page.chats?.map((chat: any) =>
                  chat.id === threadId ? { ...chat, title } : chat,
                ) || [],
            }));
          } else if (data.chats && Array.isArray(data.chats)) {
            // Handle single page structure
            return {
              ...data,
              chats: data.chats.map((chat: any) =>
                chat.id === threadId ? { ...chat, title } : chat,
              ),
            };
          }

          return data;
        },
        { revalidate: false },
      );

      // Notify sidebar components immediately
      window.dispatchEvent(
        new CustomEvent('chat-status-update', {
          detail: {
            chatId: threadId,
            status: 'completed',
            title,
            isRevealing: false,
          },
        }),
      );
    };

    window.addEventListener('chat-created', handleNewChat as EventListener);
    window.addEventListener(
      'title-generated',
      handleTitleGenerated as EventListener,
    );
    window.addEventListener(
      'threadTitleUpdated',
      handleThreadTitleUpdated as EventListener,
    );

    return () => {
      window.removeEventListener(
        'chat-created',
        handleNewChat as EventListener,
      );
      window.removeEventListener(
        'title-generated',
        handleTitleGenerated as EventListener,
      );
      window.removeEventListener(
        'threadTitleUpdated',
        handleThreadTitleUpdated as EventListener,
      );
    };
  }, []);
}
