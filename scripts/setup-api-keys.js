#!/usr/bin/env node

/**
 * Setup script for configuring multiple Gemini API keys
 * This helps handle rate limiting by automatically switching between keys
 */

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

async function setupApiKeys() {
  console.log(
    '🔑 Setting up multiple Gemini API keys for better rate limit handling\n',
  );

  console.log(
    'This script will help you configure multiple API keys to avoid rate limiting issues.',
  );
  console.log(
    'You can get API keys from: https://aistudio.google.com/app/apikey\n',
  );

  const keys = [];

  // Get primary key
  const primaryKey = await question('Enter your primary Gemini API key: ');
  if (primaryKey.trim()) {
    keys.push(primaryKey.trim());
  }

  // Get additional keys
  console.log(
    '\n💡 Tip: You can add up to 3 additional keys for better reliability',
  );

  for (let i = 1; i <= 3; i++) {
    const additionalKey = await question(
      `Enter additional API key ${i} (or press Enter to skip): `,
    );
    if (additionalKey.trim()) {
      keys.push(additionalKey.trim());
    } else {
      break;
    }
  }

  if (keys.length === 0) {
    console.log(
      '\n❌ No API keys provided. Please run the script again with valid keys.',
    );
    rl.close();
    return;
  }

  // Read existing .env.local file
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('📝 Creating new .env.local file...');
  }

  // Update or add API keys
  let updatedContent = envContent;

  // Remove existing GEMINI_API_KEY entries
  updatedContent = updatedContent.replace(/GEMINI_API_KEY(_\d+)?=.*\n?/g, '');

  // Add new keys
  keys.forEach((key, index) => {
    const keyName =
      index === 0 ? 'GEMINI_API_KEY' : `GEMINI_API_KEY_${index + 1}`;
    updatedContent += `${keyName}=${key}\n`;
  });

  // Write updated content
  fs.writeFileSync(envPath, updatedContent);

  console.log('\n✅ API keys configured successfully!');
  console.log(`📁 Updated: ${envPath}`);
  console.log(`🔑 Configured ${keys.length} API key(s)`);

  if (keys.length > 1) {
    console.log('\n🚀 Benefits of multiple keys:');
    console.log('- Automatic fallback when rate limited');
    console.log('- Better reliability and uptime');
    console.log('- Distributed load across keys');
  }

  console.log('\n📋 Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Test the application');
  console.log('3. Monitor the console for key switching messages');

  rl.close();
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\n❌ Setup cancelled');
  rl.close();
  process.exit(0);
});

// Run the setup
setupApiKeys().catch((error) => {
  console.error('❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});
