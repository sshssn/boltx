#!/usr/bin/env node

/**
 * Environment Variable Checker
 *
 * This script helps diagnose missing environment variables in production.
 * Run this locally to see what variables are missing.
 */

const requiredVars = {
  critical: ['DATABASE_URL', 'NEXTAUTH_SECRET'],
  ai: ['GROQ_API_KEY', 'OPENROUTER_API_KEY', 'GEMINI_API_KEY'],
  auth: [
    'NEXTAUTH_URL',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ],
  stripe: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
  optional: ['BRAVE_API_KEY', 'CLOUDFLARE_API_TOKEN'],
};

function checkEnvironment() {
  console.log('🔍 Checking environment variables...\n');

  let hasErrors = false;

  // Check critical variables
  console.log('📋 CRITICAL VARIABLES:');
  const missingCritical = [];
  requiredVars.critical.forEach((varName) => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: MISSING`);
      missingCritical.push(varName);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: SET`);
    }
  });

  // Check AI providers (at least one should be available)
  console.log('\n🤖 AI PROVIDERS:');
  const availableAI = [];
  requiredVars.ai.forEach((varName) => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: MISSING`);
    } else {
      console.log(`✅ ${varName}: SET`);
      availableAI.push(varName);
    }
  });

  if (availableAI.length === 0) {
    console.log('⚠️  WARNING: No AI providers configured!');
    hasErrors = true;
  } else {
    console.log(`✅ ${availableAI.length} AI provider(s) available`);
  }

  // Check auth variables
  console.log('\n🔐 AUTH VARIABLES:');
  requiredVars.auth.forEach((varName) => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: MISSING`);
    } else {
      console.log(`✅ ${varName}: SET`);
    }
  });

  // Check Stripe variables
  console.log('\n💳 STRIPE VARIABLES:');
  requiredVars.stripe.forEach((varName) => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: MISSING`);
    } else {
      console.log(`✅ ${varName}: SET`);
    }
  });

  // Check optional variables
  console.log('\n📦 OPTIONAL VARIABLES:');
  requiredVars.optional.forEach((varName) => {
    const value = process.env[varName];
    if (!value) {
      console.log(`⚠️  ${varName}: MISSING (optional)`);
    } else {
      console.log(`✅ ${varName}: SET`);
    }
  });

  // Summary
  console.log('\n📊 SUMMARY:');
  if (hasErrors) {
    console.log('❌ Environment has critical issues');
    if (missingCritical.length > 0) {
      console.log(
        `   Missing critical variables: ${missingCritical.join(', ')}`,
      );
    }
    if (availableAI.length === 0) {
      console.log('   No AI providers configured');
    }
  } else {
    console.log('✅ Environment looks good!');
  }

  // Production recommendations
  console.log('\n🚀 PRODUCTION RECOMMENDATIONS:');
  console.log('1. Set DATABASE_URL to your Neon database connection string');
  console.log('2. Set NEXTAUTH_SECRET to a secure random string');
  console.log(
    '3. Set at least one AI provider API key (GROQ_API_KEY, OPENROUTER_API_KEY, or GEMINI_API_KEY)',
  );
  console.log('4. Set NEXTAUTH_URL to your production domain');
  console.log('5. Configure OAuth providers if you want social login');
  console.log('6. Configure Stripe if you want payment processing');

  return !hasErrors;
}

// Run the check
const success = checkEnvironment();
process.exit(success ? 0 : 1);
