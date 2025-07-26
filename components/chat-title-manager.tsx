'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateTitleFromUserMessage } from '@/lib/ai/title-generation';

interface ChatTitleManagerProps {
  chatId: string;
  userMessage: string;
  aiResponse?: string;
}

export function ChatTitleManager({
  chatId,
  userMessage,
  aiResponse,
}: ChatTitleManagerProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAndUpdateTitle = useCallback(async () => {
    try {
      // Generate title from user message
      const newTitle = await generateTitleFromUserMessage(userMessage);

      // Update chat in database
      const response = await fetch(`/api/chat/${chatId}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        // Notify the system that title is ready
        window.dispatchEvent(
          new CustomEvent('title-generated', {
            detail: { chatId, title: newTitle },
          }),
        );
      }
    } catch (error) {
      console.error('Failed to generate title:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [chatId, userMessage]);

  useEffect(() => {
    // Generate title when AI response is complete, not immediately
    if (aiResponse && !isGenerating) {
      setIsGenerating(true);
      generateAndUpdateTitle();
    }
  }, [aiResponse, isGenerating, generateAndUpdateTitle]);

  return null; // This is a logic-only component
}
