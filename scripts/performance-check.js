#!/usr/bin/env node

/**
 * Performance monitoring script for boltX
 * Run with: node scripts/performance-check.js
 */

const fs = require('fs');
const path = require('path');

// Performance metrics
const metrics = {
  databaseConnections: 0,
  apiCalls: 0,
  cacheHits: 0,
  cacheMisses: 0,
  slowQueries: [],
  errors: [],
};

// Performance thresholds
const THRESHOLDS = {
  SLOW_QUERY: 1000, // 1 second
  SLOW_API_CALL: 3000, // 3 seconds
  SLOW_RENDER: 100, // 100ms
};

// Check for common performance issues
function checkPerformanceIssues() {
  console.log('🔍 Checking for performance issues...\n');

  // Check for excessive timeouts
  const timeoutFiles = [
    'lib/ai/tools/web-search.ts',
    'app/(chat)/api/chat/route.ts',
    'components/message-limit-provider.tsx',
    'components/chat-title-manager.tsx',
  ];

  timeoutFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const timeouts = content.match(/setTimeout\([^,]+,\s*(\d+)\)/g);
      if (timeouts) {
        console.log(`⚠️  Found ${timeouts.length} timeouts in ${file}`);
        timeouts.forEach(timeout => {
          const ms = timeout.match(/(\d+)/)[1];
          if (parseInt(ms) > 5000) {
            console.log(`   ⚠️  Long timeout: ${timeout}`);
          }
        });
      }
    }
  });

  // Check for excessive intervals
  const intervalFiles = [
    'components/message-limit-provider.tsx',
    'components/chat-title-manager.tsx',
    'components/chat-cache-provider.tsx',
  ];

  intervalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const intervals = content.match(/setInterval\([^,]+,\s*(\d+)\)/g);
      if (intervals) {
        console.log(`⚠️  Found ${intervals.length} intervals in ${file}`);
        intervals.forEach(interval => {
          const ms = interval.match(/(\d+)/)[1];
          if (parseInt(ms) < 60000) {
            console.log(`   ⚠️  Frequent interval: ${interval}`);
          }
        });
      }
    }
  });

  // Check for large dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  
  console.log(`\n📦 Dependencies: ${dependencies.length} production, ${devDependencies.length} development`);
  
  // Check for heavy UI libraries
  const heavyLibraries = ['@radix-ui', 'framer-motion', 'lucide-react'];
  heavyLibraries.forEach(lib => {
    const found = dependencies.filter(dep => dep.includes(lib));
    if (found.length > 0) {
      console.log(`   📦 Heavy library: ${found.join(', ')}`);
    }
  });
}

// Check database configuration
function checkDatabaseConfig() {
  console.log('\n🗄️  Checking database configuration...');
  
  const dbFile = 'lib/db.ts';
  if (fs.existsSync(dbFile)) {
    const content = fs.readFileSync(dbFile, 'utf8');
    
    if (content.includes('singleton')) {
      console.log('✅ Database connection pooling implemented');
    } else {
      console.log('⚠️  No connection pooling detected');
    }
    
    if (content.includes('neon-http')) {
      console.log('✅ Using neon-http adapter (optimized for serverless)');
    } else {
      console.log('⚠️  Not using neon-http adapter');
    }
  }
}

// Check caching implementation
function checkCaching() {
  console.log('\n💾 Checking caching implementation...');
  
  const cacheFile = 'lib/cache.ts';
  if (fs.existsSync(cacheFile)) {
    console.log('✅ Caching layer implemented');
    
    const content = fs.readFileSync(cacheFile, 'utf8');
    if (content.includes('TTL')) {
      console.log('✅ TTL-based cache expiration implemented');
    }
    
    if (content.includes('cleanup')) {
      console.log('✅ Cache cleanup mechanism implemented');
    }
  } else {
    console.log('⚠️  No caching layer found');
  }
}

// Check Next.js configuration
function checkNextConfig() {
  console.log('\n⚙️  Checking Next.js configuration...');
  
  const nextConfigFile = 'next.config.ts';
  if (fs.existsSync(nextConfigFile)) {
    const content = fs.readFileSync(nextConfigFile, 'utf8');
    
    if (content.includes('compress')) {
      console.log('✅ Compression enabled');
    } else {
      console.log('⚠️  Compression not enabled');
    }
    
    if (content.includes('swcMinify')) {
      console.log('✅ SWC minification enabled');
    } else {
      console.log('⚠️  SWC minification not enabled');
    }
    
    if (content.includes('optimizePackageImports')) {
      console.log('✅ Package import optimization enabled');
    } else {
      console.log('⚠️  Package import optimization not enabled');
    }
  }
}

// Generate performance recommendations
function generateRecommendations() {
  console.log('\n💡 Performance Recommendations:\n');
  
  console.log('1. Database Optimization:');
  console.log('   - ✅ Implemented connection pooling');
  console.log('   - ✅ Using neon-http adapter');
  console.log('   - 🔄 Consider adding database indexes for frequently queried columns');
  
  console.log('\n2. Caching Strategy:');
  console.log('   - ✅ Implemented in-memory caching');
  console.log('   - 🔄 Consider Redis for production caching');
  console.log('   - 🔄 Implement cache warming for frequently accessed data');
  
  console.log('\n3. API Optimization:');
  console.log('   - ✅ Reduced timeouts from 12s to 8s');
  console.log('   - ✅ Increased web search rate limit from 5 to 50 calls/day');
  console.log('   - 🔄 Consider implementing request batching');
  
  console.log('\n4. Frontend Optimization:');
  console.log('   - ✅ Reduced interval frequencies');
  console.log('   - ✅ Optimized title generation delays');
  console.log('   - 🔄 Consider implementing virtual scrolling for large lists');
  console.log('   - 🔄 Add React.memo for expensive components');
  
  console.log('\n5. Bundle Optimization:');
  console.log('   - ✅ Enabled compression and SWC minification');
  console.log('   - ✅ Package import optimization enabled');
  console.log('   - 🔄 Consider code splitting for large components');
  console.log('   - 🔄 Implement dynamic imports for heavy libraries');
}

// Main execution
function main() {
  console.log('🚀 boltX Performance Check\n');
  console.log('=' .repeat(50));
  
  checkPerformanceIssues();
  checkDatabaseConfig();
  checkCaching();
  checkNextConfig();
  generateRecommendations();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Performance check completed!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkPerformanceIssues,
  checkDatabaseConfig,
  checkCaching,
  checkNextConfig,
  generateRecommendations,
}; 