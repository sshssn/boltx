'use client';

import { useEffect, useRef, useCallback } from 'react';

function revealTitleAnimated(fullTitle: string, setTitle: (t: string) => void) {
  let i = 0;
  const interval = setInterval(() => {
    setTitle(fullTitle.slice(0, i + 1));
    i++;
    if (i >= fullTitle.length) clearInterval(interval);
  }, 1); // Minimal character delay for instant feel
}

interface ChatTitleManagerProps {
  chatId: string;
  userMessage: string;
  aiResponse?: string;
  isStreaming: boolean;
  onTitleChange: (title: string, isGenerating: boolean) => void;
}

export function ChatTitleManager({
  chatId,
  userMessage,
  aiResponse,
  isStreaming,
  onTitleChange,
}: ChatTitleManagerProps) {
  const titleGenerationTimeoutRef = useRef<NodeJS.Timeout>();
  const hasGeneratedTitleRef = useRef(false);
  const lastUserMessageRef = useRef('');
  const serverTitleGeneratedRef = useRef(false);
  const isGeneratingRef = useRef(false);

  // Listen for server-side title updates to prevent conflicts
  useEffect(() => {
    const handleServerTitleUpdate = (event: CustomEvent) => {
      if (event.detail?.chatId === chatId) {
        serverTitleGeneratedRef.current = true;
        hasGeneratedTitleRef.current = true;
        isGeneratingRef.current = false;

        // Don't override server-generated titles
        if (event.detail?.title && event.detail.title !== 'New Thread...') {
          onTitleChange(event.detail.title, false);

          // Dispatch immediate update for sidebar
          window.dispatchEvent(
            new CustomEvent('chat-status-update', {
              detail: {
                chatId,
                title: event.detail.title,
                status: 'completed',
                isRevealing: false,
              },
            }),
          );
        }
      }
    };

    const handleChatCreated = (event: CustomEvent) => {
      if (event.detail?.chatId === chatId) {
        // Dispatch immediate "New Thread" status
        window.dispatchEvent(
          new CustomEvent('chat-status-update', {
            detail: {
              chatId,
              title: 'New Thread...',
              status: 'generating-title',
              isRevealing: false,
            },
          }),
        );
      }
    };

    window.addEventListener(
      'title-generated',
      handleServerTitleUpdate as EventListener,
    );
    window.addEventListener(
      'threadTitleUpdated',
      handleServerTitleUpdate as EventListener,
    );
    window.addEventListener('chat-created', handleChatCreated as EventListener);

    return () => {
      window.removeEventListener(
        'title-generated',
        handleServerTitleUpdate as EventListener,
      );
      window.removeEventListener(
        'threadTitleUpdated',
        handleServerTitleUpdate as EventListener,
      );
      window.removeEventListener(
        'chat-created',
        handleChatCreated as EventListener,
      );
    };
  }, [chatId, onTitleChange]);

  const generateTitle = useCallback(async () => {
    if (
      !userMessage ||
      userMessage.trim().length === 0 ||
      isGeneratingRef.current
    ) {
      return;
    }

    // Don't regenerate if server already generated a title
    if (serverTitleGeneratedRef.current) {
      return;
    }

    // Don't regenerate if we already have a title for this message
    if (
      hasGeneratedTitleRef.current &&
      lastUserMessageRef.current === userMessage
    ) {
      return;
    }

    isGeneratingRef.current = true;

    // Set generating state immediately
    onTitleChange('New Thread...', true);

    // Dispatch event immediately for real-time UI updates
    window.dispatchEvent(
      new CustomEvent('chat-created', {
        detail: { chatId },
      }),
    );

    // Dispatch status update for sidebar
    window.dispatchEvent(
      new CustomEvent('chat-status-update', {
        detail: {
          chatId,
          title: 'New Thread...',
          status: 'generating-title',
          isRevealing: false,
        },
      }),
    );

    // Call the title generation API with faster timeout
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | undefined;

    timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    try {
      const response = await fetch('/api/chat/title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          userMessage,
          aiResponse,
        }),
        signal: controller.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new Error(`Title generation failed: ${response.status}`);
      }

      const data = await response.json();
      const title = data.title || 'New Chat';

      console.log('Title generation response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Title generation failed');
      }

      // Update state
      hasGeneratedTitleRef.current = true;
      lastUserMessageRef.current = userMessage;
      isGeneratingRef.current = false;

      // Typewriter effect for title reveal with ultra-fast speed
      revealTitleAnimated(title, (animatedTitle) => {
        onTitleChange(animatedTitle, false);

        // Dispatch real-time update event for immediate UI refresh
        window.dispatchEvent(
          new CustomEvent('title-generated', {
            detail: {
              chatId,
              title: animatedTitle,
              isRevealing: true,
            },
          }),
        );

        // Dispatch status update for sidebar
        window.dispatchEvent(
          new CustomEvent('chat-status-update', {
            detail: {
              chatId,
              title: animatedTitle,
              status: 'completed',
              isRevealing: true,
            },
          }),
        );
      });

      // Also dispatch the final title event
      window.dispatchEvent(
        new CustomEvent('title-generated', {
          detail: {
            chatId,
            title,
            isRevealing: false,
          },
        }),
      );

      // Final status update
      window.dispatchEvent(
        new CustomEvent('chat-status-update', {
          detail: {
            chatId,
            title,
            status: 'completed',
            isRevealing: false,
          },
        }),
      );
    } catch (error) {
      // Clear timeout if it hasn't been cleared yet
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle AbortError specifically (timeout or manual abort)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Title generation aborted (timeout or manual abort)');
        isGeneratingRef.current = false;

        // Use fallback title for aborted requests
        const fallbackTitle =
          userMessage.length > 30
            ? `${userMessage.substring(0, 30)}...`
            : userMessage || 'New Chat';

        onTitleChange(fallbackTitle, false);

        // Dispatch fallback title events
        window.dispatchEvent(
          new CustomEvent('title-generated', {
            detail: {
              chatId,
              title: fallbackTitle,
              isRevealing: false,
            },
          }),
        );

        window.dispatchEvent(
          new CustomEvent('chat-status-update', {
            detail: {
              chatId,
              title: fallbackTitle,
              status: 'completed',
              isRevealing: false,
            },
          }),
        );
        return;
      }

      console.error('Title generation error:', error);
      isGeneratingRef.current = false;

      // Fallback: use a simple title based on user message
      const fallbackTitle =
        userMessage.length > 50
          ? `${userMessage.substring(0, 50)}...`
          : userMessage || 'New Chat';

      onTitleChange(fallbackTitle, false);

      // Dispatch fallback title events
      window.dispatchEvent(
        new CustomEvent('title-generated', {
          detail: {
            chatId,
            title: fallbackTitle,
            isRevealing: false,
          },
        }),
      );

      window.dispatchEvent(
        new CustomEvent('chat-status-update', {
          detail: {
            chatId,
            title: fallbackTitle,
            status: 'completed',
            isRevealing: false,
          },
        }),
      );

      // Try to save the fallback title to database
      try {
        await fetch('/api/chat/title', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId,
            userMessage: fallbackTitle,
            aiResponse: null,
          }),
        });
      } catch (saveError) {
        console.error('Failed to save fallback title:', saveError);
      }
    }
  }, [chatId, userMessage, aiResponse, onTitleChange]);

  // Generate title when streaming starts and we have a user message
  useEffect(() => {
    if (isStreaming && userMessage && userMessage.trim().length > 0) {
      // Clear any existing timeout
      if (titleGenerationTimeoutRef.current) {
        clearTimeout(titleGenerationTimeoutRef.current);
      }

      // Immediate response for better UX
      titleGenerationTimeoutRef.current = setTimeout(() => {
        generateTitle();
      }, 50); // Reduced to 50ms for instant response
    }

    return () => {
      if (titleGenerationTimeoutRef.current) {
        clearTimeout(titleGenerationTimeoutRef.current);
      }
    };
  }, [isStreaming, userMessage, generateTitle]);

  // Reset title generation state when chat changes
  useEffect(() => {
    hasGeneratedTitleRef.current = false;
    lastUserMessageRef.current = '';
    serverTitleGeneratedRef.current = false;
    isGeneratingRef.current = false;
  }, [chatId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (titleGenerationTimeoutRef.current) {
        clearTimeout(titleGenerationTimeoutRef.current);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
