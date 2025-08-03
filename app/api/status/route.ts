export async function GET() {
  const status: {
    status: string;
    timestamp: string;
    environment: {
      nodeEnv: string;
      database: { configured: boolean; url: string };
      auth: { secret: string; url: string };
      ai: { groq: string; openrouter: string; gemini: string };
      stripe: { secret: string; webhook: string };
      oauth: {
        github: { clientId: string; clientSecret: string };
        google: { clientId: string; clientSecret: string };
      };
    };
    providers: {
      gemini: { primary: boolean; secondary: boolean; tertiary: boolean };
      openrouter: { primary: boolean; secondary: boolean; tertiary: boolean };
      groq: { primary: boolean };
    };
    error?: {
      type: string;
      missing: string[];
      message: string;
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      database: {
        configured: !!process.env.DATABASE_URL,
        url: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      },
      auth: {
        secret: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
        url: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
      },
      ai: {
        groq: process.env.GROQ_API_KEY ? 'SET' : 'MISSING',
        openrouter: process.env.OPENROUTER_API_KEY ? 'SET' : 'MISSING',
        gemini: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
      },
      stripe: {
        secret: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING',
        webhook: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'MISSING',
      },
      oauth: {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID ? 'SET' : 'MISSING',
          clientSecret: process.env.GITHUB_CLIENT_SECRET ? 'SET' : 'MISSING',
        },
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
        },
      },
    },
    providers: {
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
      groq: {
        primary: !!process.env.GROQ_API_KEY,
      },
    },
  };

  // Check if critical environment variables are missing
  const criticalVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
  const missingCritical = criticalVars.filter(varName => !process.env[varName]);
  
  if (missingCritical.length > 0) {
    status.status = 'error';
    status.error = {
      type: 'missing_critical_env_vars',
      missing: missingCritical,
      message: `Missing critical environment variables: ${missingCritical.join(', ')}`,
    };
  }

  return Response.json(status);
}
