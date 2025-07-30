#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

console.log('🔧 boltX API Key Setup Helper\n');

// Check for environment files (prioritize .env.local for Next.js)
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

const envLocalExists = fs.existsSync(envLocalPath);
const envExists = fs.existsSync(envPath);

// Read content from both files
let envContent = '';
if (envLocalExists) {
  console.log('📝 Reading .env.local file...');
  envContent = fs.readFileSync(envLocalPath, 'utf8');
} else if (envExists) {
  console.log('📝 Reading .env file...');
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  console.log('📝 No environment files found. Creating .env.local...');
  fs.writeFileSync(envLocalPath, '');
}

// Parse existing variables
const existingVars = {};
envContent.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    existingVars[key.trim()] = valueParts.join('=').trim();
  }
});

console.log('🔑 Setting up API keys for better reliability...\n');

// Gemini API Keys
console.log('📋 Gemini API Keys (Google AI Studio):');
console.log('   Get your keys from: https://aistudio.google.com/app/apikey\n');

const geminiKeys = ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3'];

geminiKeys.forEach((key, index) => {
  const currentValue = existingVars[key];
  const status = currentValue ? '✅ Set' : '❌ Missing';
  console.log(`   ${index + 1}. ${key}: ${status}`);
  if (currentValue) {
    console.log(`      Current: ${currentValue.substring(0, 10)}...`);
  }
});

console.log('\n🌐 OpenRouter API Keys:');
console.log('   Get your keys from: https://openrouter.ai\n');

const openRouterKeys = [
  'OPENROUTER_API_KEY',
  'OPENROUTER_API_KEY_2',
  'OPENROUTER_API_KEY_3',
];

openRouterKeys.forEach((key, index) => {
  const currentValue = existingVars[key];
  const status = currentValue ? '✅ Set' : '❌ Missing';
  console.log(`   ${index + 1}. ${key}: ${status}`);
  if (currentValue) {
    console.log(`      Current: ${currentValue.substring(0, 10)}...`);
  }
});

console.log('\n📊 Summary:');
const totalKeys = geminiKeys.length + openRouterKeys.length;
const setKeys = [...geminiKeys, ...openRouterKeys].filter(
  (key) => existingVars[key],
).length;
console.log(`   Total API keys: ${totalKeys}`);
console.log(`   Configured: ${setKeys}/${totalKeys}`);

if (setKeys === 0) {
  console.log('\n⚠️  No API keys found! You need at least:');
  console.log('   - GEMINI_API_KEY (required)');
  console.log('   - OPENROUTER_API_KEY (recommended for fallback)');
} else if (setKeys < 3) {
  console.log('\n💡 Recommendation: Add more API keys for better reliability');
  console.log('   - Multiple keys help avoid rate limiting');
  console.log('   - Automatic fallback when one key is rate limited');
} else {
  console.log(
    '\n🎉 Great! You have multiple API keys configured for maximum reliability',
  );
}

console.log('\n📝 To add API keys, edit your .env file and add:');
console.log('   GEMINI_API_KEY=your_key_here');
console.log('   GEMINI_API_KEY_2=your_second_key_here');
console.log('   OPENROUTER_API_KEY=your_openrouter_key_here');
console.log('   OPENROUTER_API_KEY_2=your_second_openrouter_key_here');

console.log('\n🚀 The app will automatically:');
console.log('   - Use multiple keys to avoid rate limiting');
console.log('   - Fall back to alternative keys when one fails');
console.log(
  '   - Provide graceful error handling when all keys are rate limited',
);
