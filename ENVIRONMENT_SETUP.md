# Environment Setup Guide

This guide helps you set up the required environment variables for boltX in production.

## Critical Environment Variables

These variables are **required** for the application to function:

### Database
- `DATABASE_URL`: Your Neon database connection string
  ```
  postgresql://username:password@host:port/database
  ```

### Authentication
- `NEXTAUTH_SECRET`: A secure random string for session encryption
  ```
  openssl rand -base64 32
  ```

## AI Provider Variables

At least **one** of these AI provider API keys is required:

### Groq (Recommended)
- `GROQ_API_KEY`: Your Groq API key from https://console.groq.com/

### OpenRouter
- `OPENROUTER_API_KEY`: Your OpenRouter API key from https://openrouter.ai/

### Google Gemini
- `GEMINI_API_KEY`: Your Google AI API key from https://makersuite.google.com/

## Optional Environment Variables

### Authentication (OAuth)
- `NEXTAUTH_URL`: Your production domain (e.g., `https://yourdomain.com`)
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### Payment Processing (Stripe)
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

### Additional Features
- `BRAVE_API_KEY`: Brave Search API key for web search
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token for AI features

## Production Deployment

### Vercel
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each required variable
4. Redeploy your application

### Other Platforms
Set the environment variables according to your hosting platform's documentation.

## Troubleshooting

### Check Environment Variables
Run the environment checker script:
```bash
node scripts/check-env.js
```

### Check API Status
Visit `/api/status` to see the current environment configuration.

### Common Issues

1. **500 errors on `/api/history` and `/api/chat`**
   - Missing `DATABASE_URL` or `NEXTAUTH_SECRET`
   - No AI provider API keys configured

2. **Authentication not working**
   - Missing `NEXTAUTH_SECRET`
   - Incorrect `NEXTAUTH_URL`

3. **AI responses failing**
   - No AI provider API keys configured
   - Invalid API keys

## Quick Setup for Development

Create a `.env.local` file with:
```env
# Database
DATABASE_URL=your_neon_database_url

# Authentication
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000

# AI Provider (choose one)
GROQ_API_KEY=your_groq_api_key
# OR
OPENROUTER_API_KEY=your_openrouter_api_key
# OR
GEMINI_API_KEY=your_gemini_api_key
```

## Security Notes

- Never commit `.env.local` to version control
- Use strong, unique secrets for `NEXTAUTH_SECRET`
- Rotate API keys regularly
- Use environment-specific API keys for development and production 