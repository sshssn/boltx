# Chat Title Generation Implementation

This document shows how to use the new chat title generation functionality in your boltX application.

## Overview

The title generation system automatically creates meaningful, concise titles for chat conversations based on user messages and AI responses. This provides a much better user experience compared to showing full-length messages in the sidebar.

## Features

- **AI-powered title generation** using Google Gemini
- **Fallback mechanisms** for when AI generation fails
- **Configurable options** for title length, style, and formatting
- **Automatic integration** with the chat API
- **Performance optimized** with non-blocking updates

## Usage Examples

### 1. Basic Title Generation from User Message

```typescript
import { generateTitleFromUserMessage } from '@/lib/ai/title-generation';

// When user sends first message
const userMessage = "Can you help me create a Python script to analyze sales data?";
const chatTitle = await generateTitleFromUserMessage(userMessage);
// Result: "Python Script for Sales Data Analysis"

// Save to your database
await updateChat(chatId, { title: chatTitle });
```

### 2. Title Generation from AI Response

```typescript
import { generateTitleFromAIResponse } from '@/lib/ai/title-generation';

// When AI responds to user message
const userMessage = "What's the best way to learn React?";
const aiResponse = "React is a popular JavaScript library for building user interfaces...";
const chatTitle = await generateTitleFromAIResponse(userMessage, aiResponse);
// Result: "Learning React: Best Practices and Resources"

// Update existing chat title
await updateChat(chatId, { title: chatTitle });
```

### 3. Custom Title Generation Options

```typescript
import { generateTitleFromUserMessage } from '@/lib/ai/title-generation';

const title = await generateTitleFromUserMessage(userMessage, {
  maxLength: 40,           // Maximum 40 characters
  includeQuestionMark: false, // Don't add question marks
  style: 'descriptive'     // More descriptive style
});
```

### 4. Integration in Chat API

The title generation is automatically integrated into the chat API endpoint:

```typescript
// In app/(chat)/api/chat/route.ts

// When creating a new chat
const userText = userMessage.parts?.[0]?.text || userMessage.content || '';
const title = await generateTitleFromUserMessage(userText);

await saveChat({
  id: chatId,
  userId: session.user.id,
  title,
  visibility: selectedVisibilityType || 'private',
});

// When AI responds, update the title
const newTitle = await generateTitleFromAIResponse(userText, assistantResponse);
await updateChatTitleById({ chatId, title: newTitle });
```

## API Reference

### generateTitleFromUserMessage(userMessage, options?)

Generates a title from a user message.

**Parameters:**
- `userMessage` (string): The user's message text
- `options` (TitleGenerationOptions, optional): Configuration options

**Returns:** Promise<string> - The generated title

### generateTitleFromAIResponse(userMessage, aiResponse, options?)

Generates a title from both user message and AI response.

**Parameters:**
- `userMessage` (string): The user's message text
- `aiResponse` (string): The AI's response text
- `options` (TitleGenerationOptions, optional): Configuration options

**Returns:** Promise<string> - The generated title

### TitleGenerationOptions

```typescript
interface TitleGenerationOptions {
  maxLength?: number;           // Default: 60
  includeQuestionMark?: boolean; // Default: true
  style?: 'concise' | 'descriptive' | 'question'; // Default: 'concise'
}
```

## Fallback Behavior

If AI title generation fails, the system falls back to a simple rule-based title generation:

1. Removes common prefixes like "I want to", "Can you", "Please"
2. Takes the first sentence or first 8 words
3. Truncates to the specified max length
4. Adds question mark if it's a question

## Performance Considerations

- Title generation is non-blocking and runs in the background
- Uses the fastest Gemini model (`gemini-2.0-flash-exp`)
- Optimized prompts for quick responses
- Fallback mechanisms ensure reliability

## Error Handling

The system gracefully handles errors:

```typescript
try {
  const title = await generateTitleFromUserMessage(userMessage);
  await updateChat(chatId, { title });
} catch (error) {
  console.error('Title generation failed:', error);
  // Use fallback title or keep existing title
}
```

## Best Practices

1. **Use for new chats**: Generate titles when creating new conversations
2. **Update after AI response**: Improve titles after the AI provides a response
3. **Handle errors gracefully**: Always have fallback mechanisms
4. **Consider user context**: Titles should reflect the main topic or question
5. **Keep titles concise**: Aim for 40-60 characters for better UI display

## Migration from Old System

If you're migrating from the old system that used full message content as titles:

```typescript
// Old way
const title = userMessage.length > 80 ? `${userMessage.substring(0, 77)}...` : userMessage;

// New way
const title = await generateTitleFromUserMessage(userMessage);
```

The new system provides much better user experience with meaningful, searchable titles instead of truncated messages. 