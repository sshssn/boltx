# Real-Time Title Generation System

## Overview

The Real-Time Title Generation System in boltX automatically generates descriptive and meaningful titles for chat threads as users interact with the AI. This system has been significantly improved to use AI-based generation for better, more accurate titles.

## Key Improvements

### AI-Based Title Generation (Primary Method)

The system now uses the Gemini AI model to generate titles, which provides much better results than the previous rule-based approach:

- **Better Understanding**: AI can understand context and intent better than rule-based parsing
- **More Accurate Titles**: Generates titles that actually reflect the conversation topic
- **Handles Complex Queries**: Can properly handle multi-topic conversations and nuanced requests
- **Consistent Quality**: Produces professional, readable titles consistently

### Fallback System

The system includes a robust fallback mechanism:

1. **AI Generation**: Primary method using Gemini AI
2. **Rule-Based Generation**: Fallback when AI is unavailable or fails
3. **Model Name**: Final fallback showing the AI model being used

## How It Works

### 1. Title Generation Trigger

Titles are generated when:
- The AI starts responding to a user message
- A new chat is created
- The first message in a conversation is sent

### 2. AI-Based Generation Process

```typescript
async function generateAITitle(userMessage: string, options: TitleGenerationOptions): Promise<string> {
  const titlePrompt = `Generate a short, clear, and descriptive thread title for this user prompt. The title should be:
- 3-6 words maximum
- Descriptive of the main topic or question
- Properly capitalized (title case)
- No quotation marks
- No question marks unless it's a direct question
- Focus on the key topic, not action words like "summarize", "explain", etc.

User prompt: "${userMessage}"

Title:`;

  const { text } = await generateText({
    model: myProvider.languageModel('gemini-2.5-flash'),
    prompt: titlePrompt,
    temperature: 0.3, // Lower temperature for more consistent results
    maxTokens: 50,
  });

  // Clean up and return the generated title
  return cleanAndFormatTitle(text);
}
```

### 3. Title Quality Improvements

**Before (Rule-based):**
- Input: "Summarize the global climate initiatives for 2025."
- Output: "Summarize Global And Climate"

**After (AI-based):**
- Input: "Summarize the global climate initiatives for 2025."
- Output: "2025 Global Climate Initiatives"

## Configuration Options

The title generation system supports various configuration options:

```typescript
interface TitleGenerationOptions {
  maxLength?: number;           // Maximum title length (default: 60)
  includeQuestionMark?: boolean; // Add question marks for questions (default: true)
  style?: 'concise' | 'descriptive' | 'question'; // Title style preference
  useModelName?: boolean;       // Use model name as fallback (default: false)
  selectedModelId?: string;     // AI model to use for generation
  prioritizeContent?: boolean;  // Prioritize content over style (default: true)
}
```

## Implementation Details

### File Structure

- `lib/ai/title-generation.ts` - Main title generation logic
- `app/(chat)/actions.ts` - Server actions for title generation
- `app/(chat)/api/chat/route.ts` - Chat API with title generation integration

### Key Functions

1. **`generateTitleFromUserMessage()`** - Primary function for generating titles from user messages
2. **`generateTitleFromAIResponse()`** - Generates titles considering both user input and AI response
3. **`generateAITitle()`** - AI-based title generation using Gemini
4. **`generateSmartTitle()`** - Rule-based fallback generation

### Error Handling

The system includes comprehensive error handling:

- **API Failures**: Gracefully falls back to rule-based generation
- **Invalid Responses**: Validates and cleans AI-generated titles
- **Rate Limiting**: Handles API rate limits with multiple key support
- **Network Issues**: Continues operation even with connectivity problems

## Testing

To test the title generation system:

```bash
# Set up API keys
npm run setup:api-keys

# Run the test script
node test-title-generation.js
```

## Performance Considerations

- **Caching**: Titles are generated once per conversation and cached
- **Async Processing**: Title generation doesn't block the main chat flow
- **Resource Management**: Uses efficient token limits and temperature settings
- **Fallback Speed**: Rule-based generation provides instant fallback

## Future Enhancements

Potential improvements for the title generation system:

1. **Multi-language Support**: Generate titles in the user's preferred language
2. **Context Awareness**: Consider conversation history for better titles
3. **User Preferences**: Allow users to customize title generation style
4. **A/B Testing**: Test different title generation strategies
5. **Analytics**: Track title quality and user satisfaction

## Troubleshooting

### Common Issues

1. **Poor Title Quality**: Ensure API keys are properly configured
2. **Slow Generation**: Check network connectivity and API response times
3. **Fallback Issues**: Verify rule-based generation logic is working
4. **Rate Limiting**: Set up multiple API keys for better reliability

### Debug Information

The system logs detailed information for debugging:

```typescript
console.log('Generated title when AI started responding:', generatedTitle);
console.error('Failed to generate title when AI started responding:', error);
```

## Conclusion

The AI-based title generation system significantly improves the user experience by providing more accurate, descriptive, and professional chat titles. The robust fallback system ensures reliability while the AI-powered approach delivers superior quality results. 