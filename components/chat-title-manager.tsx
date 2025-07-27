'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateTitleFromUserMessage } from '@/lib/ai/title-generation';

interface ChatTitleManagerProps {
  chatId: string;
  userMessage: string;
  aiResponse?: string;
  selectedModelId?: string;
}

export function ChatTitleManager({
  chatId,
  userMessage,
  aiResponse,
  selectedModelId,
}: ChatTitleManagerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [titleGenerated, setTitleGenerated] = useState(false);
  const hasStartedGenerating = useRef(false);

  const generateAndUpdateTitle = useCallback(async () => {
    if (hasStartedGenerating.current || !userMessage.trim()) {
      return;
    }

    hasStartedGenerating.current = true;
    setIsGenerating(true);

    try {
      console.log('🎯 Starting title generation for chat:', chatId);
      
      // Notify sidebar that we're starting title generation
      window.dispatchEvent(
        new CustomEvent('chat-status-update', {
          detail: { 
            chatId, 
            status: 'generating-title',
            title: 'New Chat Thread'
          },
        }),
      );

      // Generate title from user message with better context
      const titleOptions = {
        selectedModelId,
        maxLength: 35,
        style: 'concise' as const,
        includeQuestionMark: true,
      };

      const newTitle = await generateTitleFromUserMessage(userMessage, titleOptions);
      console.log('✨ Generated title:', newTitle);

      // Update chat in database
      const response = await fetch(`/api/chat/${chatId}/title`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        console.log('💾 Title saved to database');
        setTitleGenerated(true);

        // Notify the sidebar that title is ready with a slight delay for smooth UX
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('chat-status-update', {
              detail: { 
                chatId, 
                status: 'completed',
                title: newTitle
              },
            }),
          );

          // Also trigger the legacy event for backward compatibility
          window.dispatchEvent(
            new CustomEvent('title-generated', {
              detail: { chatId, title: newTitle },
            }),
          );
        }, 300); // Small delay for smooth transition
      } else {
        throw new Error('Failed to save title to database');
      }
    } catch (error) {
      console.error('❌ Failed to generate title:', error);
      
      // Fallback to a basic title
      const fallbackTitle = userMessage.split(' ').slice(0, 4).join(' ') || 'New Chat';
      
      window.dispatchEvent(
        new CustomEvent('chat-status-update', {
          detail: { 
            chatId, 
            status: 'completed',
            title: fallbackTitle
          },
        }),
      );
    } finally {
      setIsGenerating(false);
    }
  }, [chatId, userMessage, selectedModelId]);

  // Start title generation when AI response begins (not when it completes)
  useEffect(() => {
    // Only generate title once when AI starts responding
    if (aiResponse && aiResponse.length > 10 && !titleGenerated && !isGenerating) {
      console.log('🚀 AI response detected, starting title generation');
      generateAndUpdateTitle();
    }
  }, [aiResponse, titleGenerated, isGenerating, generateAndUpdateTitle]);

  // Also handle the case where AI response comes in chunks
  useEffect(() => {
    const handleStreamStart = (event: CustomEvent) => {
      const { chatId: eventChatId } = event.detail;
      if (eventChatId === chatId && !titleGenerated && !isGenerating) {
        console.log('📡 Stream started, generating title');
        generateAndUpdateTitle();
      }
    };

    window.addEventListener('ai-stream-start', handleStreamStart as EventListener);
    
    return () => {
      window.removeEventListener('ai-stream-start', handleStreamStart as EventListener);
    };
  }, [chatId, titleGenerated, isGenerating, generateAndUpdateTitle]);

  return null; // This is a logic-only component
}
