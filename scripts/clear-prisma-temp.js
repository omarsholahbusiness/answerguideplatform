const fs = require('fs');
const path = require('path');

const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');

console.log('Clearing temporary Prisma query engine files...');
console.log(`Looking in: ${prismaClientPath}\n`);

if (!fs.existsSync(prismaClientPath)) {
  console.log('Prisma client directory not found. Nothing to clean.');
  process.exit(0);
}

try {
  const files = fs.readdirSync(prismaClientPath);
  
  // Look for various temporary file patterns:
  // - Files ending in .tmp
  // - Files starting with query-engine and containing .tmp
  // - Files with .tmp in the middle
  const tempFiles = files.filter(file => {
    const lowerName = file.toLowerCase();
    return lowerName.endsWith('.tmp') || 
           lowerName.includes('.tmp') ||
           (file.startsWith('query-engine') && lowerName.includes('tmp'));
  });
  
  if (tempFiles.length === 0) {
    console.log('✓ No temporary files found. Directory is clean!');
    process.exit(0);
  }
  
  console.log(`Found ${tempFiles.length} temporary file(s):`);
  tempFiles.forEach(file => {
    const filePath = path.join(prismaClientPath, file);
    const stats = fs.statSync(filePath);
    console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  });
  console.log('');
  
  let deletedCount = 0;
  let failedCount = 0;
  
  tempFiles.forEach(file => {
    try {
      const filePath = path.join(prismaClientPath, file);
      fs.unlinkSync(filePath);
      console.log(`✓ Deleted: ${file}`);
      deletedCount++;
    } catch (error) {
      if (error.code === 'EBUSY' || error.code === 'EPERM') {
        console.error(`✗ Failed to delete ${file}: File is locked or in use. Close Prisma Studio and try again.`);
      } else {
        console.error(`✗ Failed to delete ${file}: ${error.message}`);
      }
      failedCount++;
    }
  });
  
  console.log(`\nSummary:`);
  console.log(`  ✓ Successfully deleted: ${deletedCount} file(s)`);
  if (failedCount > 0) {
    console.log(`  ✗ Failed to delete: ${failedCount} file(s)`);
    console.log(`\nTip: Make sure Prisma Studio and all Node processes are stopped before cleaning.`);
  }
} catch (error) {
  console.error('Error cleaning temporary files:', error.message);
  process.exit(1);
}

