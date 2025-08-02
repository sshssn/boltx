# Fix AI Streaming Response Issues in Next.js App

I have a Next.js AI app where responses are not streaming properly. Currently, one word appears, then after 4-5 seconds the whole answer flashes into place instead of streaming smoothly word by word.

## Current Issues:
- Response appears to buffer instead of stream
- Long delay before content appears
- Poor user experience with choppy text rendering

## What I need you to fix:

1. **Check API Route Streaming Setup**:
   - Ensure the API route properly implements streaming responses
   - Verify Response.body with ReadableStream is correctly configured
   - Make sure headers include proper streaming content-type

2. **Fix Frontend Streaming Consumption**:
   - Implement proper fetch with streaming response handling
   - Use TextDecoder to properly parse streamed chunks
   - Ensure state updates happen incrementally, not in batches

3. **Buffer Management**:
   - Prevent response buffering at middleware level
   - Check for any caching mechanisms interfering with streaming
   - Ensure chunks are flushed immediately

4. **Common Patterns to Implement**:
   - Use `new TextEncoder().encode()` for streaming chunks
   - Implement proper error handling for streaming connections
   - Add loading states and streaming indicators

## Expected Behavior:
- Text should appear word by word or chunk by chunk smoothly
- No long delays between response start and content appearing
- Responsive, real-time streaming experience

Please review my current implementation and fix any issues preventing smooth streaming. Show me the corrected API route and frontend code with proper streaming implementation.