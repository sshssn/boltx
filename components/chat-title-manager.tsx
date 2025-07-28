'use client';

import { useEffect, useRef, useCallback } from 'react';

function revealTitleAnimated(fullTitle: string, setTitle: (t: string) => void) {
  let i = 0;
  const interval = setInterval(() => {
    setTitle(fullTitle.slice(0, i + 1));
    i++;
    if (i >= fullTitle.length) clearInterval(interval);
  }, 8); // Blazing fast character delay - reduced from 15ms to 8ms
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

  const generateTitle = useCallback(async () => {
    if (!userMessage || userMessage.trim().length === 0) {
      return;
    }

    // Don't regenerate if we already have a title for this message
    if (
      hasGeneratedTitleRef.current &&
      lastUserMessageRef.current === userMessage
    ) {
      return;
    }

    // Set generating state immediately
    onTitleChange('New Thread...', true);

    // Dispatch event immediately for real-time UI updates
    window.dispatchEvent(
      new CustomEvent('chat-created', {
        detail: { chatId },
      }),
    );

    try {
      // Call the title generation API
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
      });

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

      // Typewriter effect for title reveal with blazing fast speed
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
    } catch (error) {
      console.error('Title generation error:', error);

      // Fallback: use a simple title based on user message
      const fallbackTitle =
        userMessage.length > 50
          ? `${userMessage.substring(0, 50)}...`
          : userMessage || 'New Chat';

      onTitleChange(fallbackTitle, false);

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

      // Reduced delay for faster response
      titleGenerationTimeoutRef.current = setTimeout(() => {
        generateTitle();
      }, 200); // Reduced from 500ms to 200ms for faster response
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
