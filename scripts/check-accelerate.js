require('dotenv').config();

console.log('=== Prisma Accelerate Status Check ===\n');

// Check environment variables
const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
const databaseUrl = process.env.DATABASE_URL;
const directDatabaseUrl = process.env.DIRECT_DATABASE_URL;

console.log('Environment Variables:');
console.log(`  PRISMA_ACCELERATE_URL: ${accelerateUrl ? '✓ Set' : '✗ Not set'}`);
if (accelerateUrl) {
  // Mask the API key for security
  const maskedUrl = accelerateUrl.replace(/api_key=[^&]+/, 'api_key=***');
  console.log(`    URL: ${maskedUrl}`);
}
console.log(`  DATABASE_URL: ${databaseUrl ? '✓ Set' : '✗ Not set'}`);
console.log(`  DIRECT_DATABASE_URL: ${directDatabaseUrl ? '✓ Set' : '✗ Not set'}`);
console.log('');

// Check if Accelerate would be used
if (accelerateUrl) {
  console.log('✓ Accelerate is ENABLED in code');
  console.log('  The application will use Prisma Accelerate for database connections.');
  console.log('');
  console.log('⚠️  Important Notes:');
  console.log('  1. Make sure Accelerate IPs are whitelisted in your Aiven firewall');
  console.log('  2. If you see P6008 errors, Accelerate cannot reach your database');
  console.log('  3. Check your Prisma Accelerate dashboard for connection status');
} else {
  console.log('✗ Accelerate is DISABLED');
  console.log('  The application will use direct database connections.');
  console.log('  To enable: Set PRISMA_ACCELERATE_URL in your .env file');
}

// Check for duplicate PRISMA_ACCELERATE_URL (common issue)
const envContent = require('fs').readFileSync('.env', 'utf8');
const accelerateMatches = envContent.match(/PRISMA_ACCELERATE_URL=/g);
if (accelerateMatches && accelerateMatches.length > 1) {
  console.log('');
  console.log('⚠️  WARNING: PRISMA_ACCELERATE_URL is defined multiple times in .env');
  console.log(`   Found ${accelerateMatches.length} occurrences. Only the last one will be used.`);
  console.log('   Remove duplicate entries to avoid confusion.');
}

console.log('');

