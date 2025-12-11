require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

const prismaPath = path.join(__dirname, '..', 'node_modules', '.bin', 'prisma');
const isWindows = process.platform === 'win32';
const prismaCmd = isWindows ? `${prismaPath}.cmd` : prismaPath;

console.log('Starting Prisma Studio on port 5556...');
console.log('Using DIRECT_DATABASE_URL for direct database connection...');

// Prisma Studio reads DATABASE_URL from schema.prisma
// We need to override it with DIRECT_DATABASE_URL to bypass Accelerate
// Also remove PRISMA_ACCELERATE_URL so Studio doesn't try to use it
const studioEnv = {
  ...process.env,
  DATABASE_URL: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
};

// Remove PRISMA_ACCELERATE_URL to force direct connection
delete studioEnv.PRISMA_ACCELERATE_URL;

if (!studioEnv.DATABASE_URL) {
  console.error('ERROR: DIRECT_DATABASE_URL or DATABASE_URL must be set in .env file');
  process.exit(1);
}

const studio = spawn(prismaCmd, ['studio', '--port', '5556'], {
  stdio: 'inherit',
  shell: true,
  env: studioEnv,
});

studio.on('error', (error) => {
  console.error('Error starting Prisma Studio:', error);
  process.exit(1);
});

studio.on('close', (code) => {
  console.log(`Prisma Studio exited with code ${code}`);
  process.exit(code);
});

