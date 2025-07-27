# Token Limit Testing Guide

## Issues Fixed

### 1. Network Error Component Not Showing
**Problem**: NetworkError component wasn't appearing when AI was unresponsive or returned blank messages.

**Fixes Applied**:
- Enhanced error detection in `messages.tsx` to catch empty assistant messages
- Added timeout detection for unresponsive AI (45 seconds)
- Added streaming timeout detection (30 seconds)
- Improved error message display with sticky positioning

**Test Steps**:
1. Start a chat and wait for AI to be unresponsive
2. Send a message that might cause an empty response
3. Check if NetworkError component appears with retry button
4. Verify retry functionality works

### 2. Token Limit Reset on Refresh/New Chat
**Problem**: Token limits reset when force refreshing or opening new chats because of cookie-only persistence.

**Fixes Applied**:
- Added initialization cookie (`boltX_initialized`) to track proper setup
- Enhanced server-side sync with better retry logic
- Improved cookie validation and fallback mechanisms
- Added proper session status checking before initialization
- Enhanced periodic sync for logged-in users

**Test Steps**:
1. As guest: Send messages until near limit, force refresh → should maintain count
2. As regular user: Send messages, open new chat → should maintain count
3. As guest: Use messages, close browser, reopen → should maintain count (same day)
4. Wait for new day → should reset to 0

### 3. Account Dashboard Sync Issues
**Problem**: Account dashboard token counter not syncing with actual usage.

**Fixes Applied**:
- Added periodic refresh every 30 seconds in account dashboard
- Implemented cross-component event system for real-time updates
- Enhanced API calls with cache-busting timestamps
- Added proper error handling and fallback values

**Test Steps**:
1. Open account dashboard, note current usage
2. Send messages in chat
3. Return to account dashboard → should show updated usage
4. Keep dashboard open while chatting → should update in real-time

## Testing Scenarios

### Guest Users
1. **Fresh session**: Should start with 0/20 messages
2. **Message sending**: Should increment counter properly
3. **Page refresh**: Should maintain counter (same day)
4. **Browser restart**: Should maintain counter (same day)
5. **New day**: Should reset to 0/20
6. **Limit reached**: Should show upgrade prompt

### Regular Users
1. **Fresh session**: Should start with 0/50 messages
2. **Message sending**: Should sync with server
3. **Multiple tabs**: Should sync across tabs
4. **Account dashboard**: Should show real-time updates
5. **Limit reached**: Should show upgrade prompt

### Error Handling
1. **AI unresponsive**: Should show NetworkError after 45 seconds
2. **Empty AI response**: Should detect and show NetworkError immediately
3. **Network issues**: Should show appropriate error message
4. **Retry functionality**: Should remove broken messages and regenerate

## Key Files Modified

1. `components/message-limit-provider.tsx` - Core token limit logic
2. `components/messages.tsx` - Error detection and handling
3. `components/chat.tsx` - Enhanced error handling
4. `app/account/ClientAccountDashboard.tsx` - Dashboard sync improvements

## Production Deployment Notes

- Monitor server logs for API errors during token sync
- Check browser console for client-side error messages
- Verify cookie persistence across sessions
- Test with different user types (guest, regular, pro)
- Monitor for rate limiting issues with enhanced API calls