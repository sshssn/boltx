# Troubleshooting Guide

## OpenRouter Rate Limiting Issues

If you're experiencing "429 Too Many Requests" errors with OpenRouter, here are the solutions:

### 1. Multiple API Keys (Recommended)

The app now supports multiple OpenRouter API keys for automatic fallback:

```env
OPENROUTER_API_KEY=your_primary_key
OPENROUTER_API_KEY_2=your_secondary_key
OPENROUTER_API_KEY_3=your_tertiary_key
```

**Benefits:**
- Automatic switching when one key is rate limited
- Better reliability and uptime
- Distributed load across multiple keys

### 2. Check Your Current Setup

Run the setup script to see your current configuration:

```bash
node scripts/setup-api-keys.js
```

Or check the status endpoint:

```bash
curl http://localhost:3000/api/status
```

### 3. Rate Limiting Solutions

#### For Development:
- Use multiple API keys as described above
- Consider upgrading to a paid OpenRouter plan for higher limits
- Use the reasoning mode sparingly (it uses DeepSeek R1 which has stricter limits)

#### For Production:
- Set up multiple API keys for redundancy
- Monitor usage and implement proper rate limiting
- Consider using a queue system for high-traffic scenarios

### 4. Immediate Fixes

If you're currently experiencing rate limiting:

1. **Wait**: OpenRouter rate limits typically reset after 1 minute
2. **Add More Keys**: Get additional API keys from [OpenRouter](https://openrouter.ai)
3. **Use Gemini**: The app will automatically fall back to Gemini when OpenRouter fails
4. **Check Usage**: Monitor your OpenRouter dashboard for usage patterns

### 5. Error Messages Explained

- `"OpenRouter API rate limited - please wait before trying again"`: Your current API key has hit the rate limit
- `"All OpenRouter API keys are rate limited"`: All configured keys are rate limited
- `"OpenRouter reasoning mode failed"`: The reasoning mode (DeepSeek R1) failed, falling back to Gemini

### 6. Configuration Tips

#### Environment Variables:
```env
# Required for basic functionality
GEMINI_API_KEY=your_gemini_key

# Recommended for fallback and reasoning
OPENROUTER_API_KEY=your_openrouter_key

# Optional: Additional keys for better reliability
GEMINI_API_KEY_2=your_second_gemini_key
GEMINI_API_KEY_3=your_third_gemini_key
OPENROUTER_API_KEY_2=your_second_openrouter_key
OPENROUTER_API_KEY_3=your_third_openrouter_key
```

#### OpenRouter Models:
- **DeepSeek R1**: Used for reasoning mode (higher quality, stricter limits)
- **Gemma 3N E2B**: Used for general fallback (more generous limits)

### 7. Monitoring

The app includes built-in monitoring:

- **Console Logs**: Check for rate limiting messages
- **Status Endpoint**: `/api/status` shows key availability
- **Error Handling**: Graceful fallbacks when APIs fail

### 8. Getting Help

If you continue to experience issues:

1. Check the console logs for detailed error messages
2. Verify your API keys are valid and have sufficient credits
3. Monitor your OpenRouter dashboard for usage limits
4. Consider upgrading your OpenRouter plan for higher limits

## Common Issues

### "No OpenRouter API keys configured"
**Solution**: Add at least one `OPENROUTER_API_KEY` to your environment variables.

### "All providers failed"
**Solution**: Check that you have at least one valid `GEMINI_API_KEY` configured.

### "Request timeout"
**Solution**: The API request took too long. This usually resolves itself, but you can try again.

### "Unable to track usage"
**Solution**: This is a guest user issue. Try logging in or check your IP address configuration. 