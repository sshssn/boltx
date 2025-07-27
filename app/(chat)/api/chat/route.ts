import { auth } from '@/app/(auth)/auth';
import {
  getChatById,
  getChatsByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  getMemoryByUserId,
} from '@/lib/db/queries';
import type { Chat } from '@/lib/db/schema';
import { generateTitleFromUserMessage } from '@/lib/ai/title-generation';
import type { ChatMessage } from '@/lib/types';
import { generateUUID } from '@/lib/utils';
import { ChatSDKError } from '@/lib/errors';

export async function POST(request: Request) {
  const {
    id: chatId,
    messages,
    selectedChatModel,
    selectedVisibilityType,
  } = await request.json();

  const session = await auth();

  if (!session || !session.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Get the user message (the last message should be from the user)
  const userMessage = messages[messages.length - 1];
  if (!userMessage || userMessage.role !== 'user') {
    return new ChatSDKError('bad_request:chat').toResponse();
  }

  try {
    // Save user message to database
    try {
             const messageToSave = {
         id: generateUUID(),
         chatId,
         role: userMessage.role,
         parts: userMessage.parts,
         attachments: userMessage.attachments || [],
         createdAt: new Date(),
       };

      await saveMessages({ messages: [messageToSave] });
    } catch (error) {
      console.error('Failed to save user message to database:', error);
      // Continue with AI generation even if database fails
    }

    // Check/create chat with "New Chat Thread" title initially
    let chatTitle = '';
    let isNewChat = false;
    
    try {
      const chat = await getChatById({ id: chatId });
      if (!chat) {
        // Create chat with temporary title initially
        chatTitle = 'New Chat Thread';
        isNewChat = true;
        console.log('🆕 Creating new chat with temporary title:', chatTitle);

        await saveChat({
          id: chatId,
          userId: session.user.id,
          title: chatTitle,
          visibility: selectedVisibilityType || 'private',
        });

        console.log('✅ Chat created with temporary title');
      } else {
        chatTitle = chat.title;
        // Check if this is still a new chat that needs title generation
        isNewChat = !chat.title || chat.title === 'New Chat Thread' || chat.title === 'New Thread' || chat.title === 'New Chat';
      }
    } catch (error) {
      console.error('Failed to save chat:', error);
      chatTitle = 'New Chat Thread';
      isNewChat = true;
    }

    // Initialize Gemini provider
    const { geminiProvider } = await import('@/lib/ai/providers');

    // Only fetch memory if user is a regular (logged-in) user
    let memoryItems: Array<{ content: string }> = [];
    if (session?.user && session.user.type === 'regular') {
      try {
        memoryItems = await getMemoryByUserId({
          userId: session.user.id,
          limit: 20,
        });
      } catch (error) {
        console.error('Failed to fetch memory:', error);
      }
    }

    // Prepare context for AI
    let contents: any[] = [];

    // Add memory context for regular users
    if (memoryItems.length > 0) {
      const memoryContext = memoryItems.map((item) => item.content).join('\n');
      contents.push({
        role: 'user',
        parts: [
          {
            text: `Context from previous conversations: ${memoryContext}`,
          },
        ],
      });
    }

    // Add conversation history
    try {
      const existingMessages = await getMessagesByChatId({ id: chatId });
      
             // Convert existing messages to the format expected by the model
       const historyMessages = existingMessages
         .filter((msg) => msg.id !== userMessage.id) // Exclude the current message
         .map((msg) => ({
           role: msg.role,
           parts: msg.parts || [{ text: '' }],
         }));

      contents.push(...historyMessages);
    } catch (error) {
      console.error('Failed to fetch conversation history:', error);
    }

    // Add the current user message
    contents.push({
      role: userMessage.role,
      parts: userMessage.parts || [{ text: userMessage.content }],
    });

             // Generate AI response
    const model = geminiProvider.languageModel(selectedChatModel || 'gemini-2.0-flash-exp');
    const stream = await model.doStream({
      inputFormat: 'messages',
      mode: { type: 'regular' },
      prompt: contents,
    });

    let fullResponse = '';
    let titleGenerated = false;
    let streamStarted = false;

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = stream.stream.getReader();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = value.type === 'text-delta' ? value.textDelta : '';

            if (text) {
              // Emit stream start event for title generation on first chunk
              if (!streamStarted && isNewChat) {
                streamStarted = true;
                console.log('📡 Emitting ai-stream-start event for chat:', chatId);
                
                // This would be handled by client-side JavaScript if we had access to it
                // For now, we'll generate the title after we get some response content
              }

              // Generate title when we have enough AI response content (not on first chunk)
              if (!titleGenerated && isNewChat && fullResponse.length > 50) {
                titleGenerated = true;
                
                try {
                  console.log('🎯 Generating title for new chat');
                  const userText = userMessage.parts?.[0]?.text || userMessage.content || '';
                  
                  const generatedTitle = await generateTitleFromUserMessage(
                    userText,
                    {
                      selectedModelId: selectedChatModel,
                      maxLength: 35,
                      style: 'concise',
                      includeQuestionMark: true,
                    },
                  );

                  // Update chat title in database
                  await updateChatTitleById({
                    chatId,
                    title: generatedTitle,
                  });

                  console.log('✨ Generated and saved title:', generatedTitle);
                  
                  // Send title update to client
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ 
                        type: 'title-update',
                        chatId,
                        title: generatedTitle 
                      })}\n\n`,
                    ),
                  );
                } catch (error) {
                  console.error('❌ Failed to generate title:', error);
                }
              }

              fullResponse += text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text })}\n\n`,
                ),
              );
            }
          }
          
          reader.releaseLock();

          // Save the complete AI response
          try {
                         const assistantMessage = {
               id: generateUUID(),
               chatId,
               role: 'assistant' as const,
               parts: [{ type: 'text' as const, text: fullResponse }],
               attachments: [],
               createdAt: new Date(),
             };

            await saveMessages({ messages: [assistantMessage] });
          } catch (error) {
            console.error('Failed to save assistant message:', error);
          }

          // Final title generation fallback if not done yet
          if (!titleGenerated && isNewChat && fullResponse.length > 0) {
            try {
              const userText = userMessage.parts?.[0]?.text || userMessage.content || '';
              const generatedTitle = await generateTitleFromUserMessage(
                userText,
                {
                  selectedModelId: selectedChatModel,
                  maxLength: 35,
                  style: 'concise',
                  includeQuestionMark: true,
                },
              );

              await updateChatTitleById({
                chatId,
                title: generatedTitle,
              });

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ 
                    type: 'title-update',
                    chatId,
                    title: generatedTitle 
                  })}\n\n`,
                ),
              );
            } catch (error) {
              console.error('Failed final title generation:', error);
            }
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ 
                error: 'Failed to generate response' 
              })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new ChatSDKError('bad_request:chat').toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Bad Request', { status: 400 });
  }

  const session = await auth();

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // For now, just return success since we're not using the database
  return new Response('OK', { status: 200 });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
  try {
    const { chats } = await getChatsByUserId({
      id: session.user.id,
      limit: Math.min(limit, 100),
      startingAfter: null,
      endingBefore: null,
    });
    return Response.json({ chats });
  } catch (error) {
    console.error('Chat history fetch error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
