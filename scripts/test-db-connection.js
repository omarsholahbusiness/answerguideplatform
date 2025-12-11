require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('Testing database connection...\n');
  
  const directUrl = process.env.DIRECT_DATABASE_URL;
  const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
  
  console.log('Environment Variables:');
  console.log(`  DIRECT_DATABASE_URL: ${directUrl ? '✓ Set' : '✗ Not set'}`);
  console.log(`  PRISMA_ACCELERATE_URL: ${accelerateUrl ? '✓ Set' : '✗ Not set'}`);
  console.log('');
  
  if (!directUrl) {
    console.error('ERROR: DIRECT_DATABASE_URL is not set');
    process.exit(1);
  }
  
  // Mask password in URL for display
  const maskedUrl = directUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
  console.log(`Connecting to: ${maskedUrl}\n`);
  
  try {
    // Ensure the URL uses postgresql:// not postgres://
    let connectionUrl = directUrl;
    if (connectionUrl.startsWith('postgres://')) {
      connectionUrl = connectionUrl.replace('postgres://', 'postgresql://');
      console.log('⚠️  Converted postgres:// to postgresql://');
    }
    
    // Create a Prisma client with direct connection
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: connectionUrl,
        },
      },
      log: ['error', 'warn'],
    });
    
    console.log('Attempting to connect...');
    console.log('  (This may take 10-30 seconds...)');
    
    // Set a timeout for the connection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000);
    });
    
    // Try a simple query with timeout
    const connectPromise = prisma.$queryRaw`SELECT 1 as test`;
    const result = await Promise.race([connectPromise, timeoutPromise]);
    
    console.log('✓ Connection successful!');
    console.log(`  Test query result:`, result);
    
    // Try to get user count
    const userCount = await prisma.user.count();
    console.log(`✓ Database is accessible`);
    console.log(`  Total users: ${userCount}`);
    
    await prisma.$disconnect();
    console.log('\n✓ Connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.error('\nPossible causes:');
      console.error('  1. Database server is down');
      console.error('  2. Firewall blocking connection (check Aiven firewall settings)');
      console.error('  3. Network connectivity issue');
      console.error('  4. Incorrect connection string');
    } else if (error.message.includes("P1001")) {
      console.error('\nThis is a Prisma connection error. Check:');
      console.error('  1. Database server is running');
      console.error('  2. Connection string is correct');
      console.error('  3. SSL/TLS settings are correct');
    }
    
    process.exit(1);
  }
}

testConnection();

