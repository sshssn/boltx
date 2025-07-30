import { NextResponse } from 'next/server';

export async function GET() {
  const status = {
    timestamp: new Date().toISOString(),
    environment: {
      gemini: {
        primary: !!process.env.GEMINI_API_KEY,
        secondary: !!process.env.GEMINI_API_KEY_2,
        tertiary: !!process.env.GEMINI_API_KEY_3,
      },
      openrouter: {
        primary: !!process.env.OPENROUTER_API_KEY,
        secondary: !!process.env.OPENROUTER_API_KEY_2,
        tertiary: !!process.env.OPENROUTER_API_KEY_3,
      },
    },
    recommendations: [] as string[],
  };

  // Count available keys
  const geminiKeys = Object.values(status.environment.gemini).filter(
    Boolean,
  ).length;
  const openRouterKeys = Object.values(status.environment.openrouter).filter(
    Boolean,
  ).length;

  // Add recommendations
  if (geminiKeys === 0) {
    status.recommendations.push(
      'Add at least one GEMINI_API_KEY for basic functionality',
    );
  } else if (geminiKeys < 3) {
    status.recommendations.push(
      'Consider adding more Gemini API keys for better rate limit handling',
    );
  }

  if (openRouterKeys === 0) {
    status.recommendations.push(
      'Add OPENROUTER_API_KEY for fallback and reasoning mode support',
    );
  } else if (openRouterKeys < 3) {
    status.recommendations.push(
      'Consider adding more OpenRouter API keys for better reliability',
    );
  }

  if (geminiKeys >= 2 && openRouterKeys >= 2) {
    status.recommendations.push(
      'Great! You have multiple API keys configured for maximum reliability',
    );
  }

  return NextResponse.json(status);
}
