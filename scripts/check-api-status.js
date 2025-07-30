#!/usr/bin/env node

/**
 * API Status Checker for boltX
 * This script helps diagnose API key issues and rate limiting problems
 */

const https = require('node:https');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkGeminiAPI(apiKey) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models?key=${apiKey}`,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ status: 'active', quota: 'unknown' });
        } else if (res.statusCode === 403) {
          resolve({ status: 'quota_exceeded', quota: 'exceeded' });
        } else if (res.statusCode === 401) {
          resolve({ status: 'invalid_key', quota: 'invalid' });
        } else {
          resolve({ status: 'error', quota: 'error', code: res.statusCode });
        }
      });
    });

    req.on('error', () => {
      resolve({ status: 'network_error', quota: 'error' });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 'timeout', quota: 'error' });
    });

    req.end();
  });
}

function checkGroqAPI(apiKey) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/models',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ status: 'active', quota: 'available' });
        } else if (res.statusCode === 401) {
          resolve({ status: 'invalid_key', quota: 'invalid' });
        } else if (res.statusCode === 429) {
          resolve({ status: 'rate_limited', quota: 'limited' });
        } else {
          resolve({ status: 'error', quota: 'error', code: res.statusCode });
        }
      });
    });

    req.on('error', () => {
      resolve({ status: 'network_error', quota: 'error' });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 'timeout', quota: 'error' });
    });

    req.end();
  });
}

async function main() {
  log('🔍 boltX API Status Checker', 'bold');
  log('========================', 'blue');
  console.log('');

  // Check environment variables
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiKey2 = process.env.GEMINI_API_KEY_2;
  const geminiKey3 = process.env.GEMINI_API_KEY_3;
  const groqKey = process.env.GROQ_API_KEY;

  log('📋 Environment Variables Check:', 'bold');

  if (geminiKey) {
    log('✅ GEMINI_API_KEY: Set', 'green');
  } else {
    log('❌ GEMINI_API_KEY: Not set', 'red');
  }

  if (geminiKey2) {
    log('✅ GEMINI_API_KEY_2: Set', 'green');
  } else {
    log('⚠️  GEMINI_API_KEY_2: Not set (optional)', 'yellow');
  }

  if (geminiKey3) {
    log('✅ GEMINI_API_KEY_3: Set', 'green');
  } else {
    log('⚠️  GEMINI_API_KEY_3: Not set (optional)', 'yellow');
  }

  if (groqKey) {
    log('✅ GROQ_API_KEY: Set', 'green');
  } else {
    log('⚠️  GROQ_API_KEY: Not set (optional fallback)', 'yellow');
  }

  console.log('');

  // Test API keys
  log('🧪 Testing API Keys:', 'bold');

  if (geminiKey) {
    log('Testing Gemini API...', 'blue');
    const geminiStatus = await checkGeminiAPI(geminiKey);

    if (geminiStatus.status === 'active') {
      log('✅ Gemini API: Working', 'green');
    } else if (geminiStatus.status === 'quota_exceeded') {
      log('❌ Gemini API: Quota exceeded', 'red');
    } else if (geminiStatus.status === 'invalid_key') {
      log('❌ Gemini API: Invalid key', 'red');
    } else {
      log(`❌ Gemini API: Error (${geminiStatus.status})`, 'red');
    }
  }

  if (groqKey) {
    log('Testing Groq API...', 'blue');
    const groqStatus = await checkGroqAPI(groqKey);

    if (groqStatus.status === 'active') {
      log('✅ Groq API: Working', 'green');
    } else if (groqStatus.status === 'rate_limited') {
      log('⚠️  Groq API: Rate limited', 'yellow');
    } else if (groqStatus.status === 'invalid_key') {
      log('❌ Groq API: Invalid key', 'red');
    } else {
      log(`❌ Groq API: Error (${groqStatus.status})`, 'red');
    }
  }

  console.log('');
  log('💡 Recommendations:', 'bold');

  if (!geminiKey) {
    log(
      '1. Get a Gemini API key from: https://makersuite.google.com/app/apikey',
      'yellow',
    );
  }

  if (!groqKey) {
    log(
      '2. Get a Groq API key from: https://console.groq.com/keys (free tier available)',
      'yellow',
    );
  }

  if (geminiKey) {
    log('3. If Gemini quota is exceeded, consider:', 'yellow');
    log('   - Upgrading your Gemini API plan', 'yellow');
    log(
      '   - Adding more API keys (GEMINI_API_KEY_2, GEMINI_API_KEY_3)',
      'yellow',
    );
    log('   - Using Groq as fallback', 'yellow');
  }

  log('4. For rate limiting issues:', 'yellow');
  log('   - Wait a few minutes before trying again', 'yellow');
  log('   - Check your API usage in the respective dashboards', 'yellow');
  log('   - Consider implementing better caching', 'yellow');

  console.log('');
  log('🚀 Quick Fixes:', 'bold');
  log('• Restart your development server: pnpm run dev', 'blue');
  log('• Clear browser cache and cookies', 'blue');
  log('• Check your .env.local file for correct API keys', 'blue');
  log('• Monitor the console for specific error messages', 'blue');
}

// Load environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, continue without it
}

main().catch(console.error);
