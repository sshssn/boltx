import { useEffect } from 'react';
import { mutate } from 'swr';

export function useChatTitleUpdates() {
  useEffect(() => {
    // Listen for new chat creation
    const handleNewChat = (event: CustomEvent) => {
      const { chatId } = event.detail;

      // Dispatch event to show "New Thread" in sidebar
      window.dispatchEvent(
        new CustomEvent('chat-status-update', {
          detail: {
            chatId,
            status: 'generating-title',
            title: 'New Thread',
          },
        }),
      );
    };

    // Listen for title generation completion
    const handleTitleGenerated = (event: CustomEvent) => {
      const { chatId, title } = event.detail;

      // Update the chat history cache immediately
      mutate(
        (key) => typeof key === 'string' && key.includes('/api/history'),
        (data: any) => {
          if (!data) return data;

          return data.map((page: any) => ({
            ...page,
            chats: page.chats.map((chat: any) =>
              chat.id === chatId ? { ...chat, title } : chat,
            ),
          }));
        },
        { revalidate: false },
      );

      // Notify sidebar components
      window.dispatchEvent(
        new CustomEvent('chat-status-update', {
          detail: {
            chatId,
            status: 'completed',
            title,
          },
        }),
      );
    };

    window.addEventListener('chat-created', handleNewChat as EventListener);
    window.addEventListener(
      'title-generated',
      handleTitleGenerated as EventListener,
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
    };
  }, []);
}
