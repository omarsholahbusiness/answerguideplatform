require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function countRecentUsers() {
  console.log('=== Recent Users Report (Last 24 Hours) ===\n');
  
  const directUrl = process.env.DIRECT_DATABASE_URL;
  
  if (!directUrl) {
    console.error('ERROR: DIRECT_DATABASE_URL is not set');
    process.exit(1);
  }
  
  // Ensure the URL uses postgresql:// not postgres://
  let connectionUrl = directUrl;
  if (connectionUrl.startsWith('postgres://')) {
    connectionUrl = connectionUrl.replace('postgres://', 'postgresql://');
  }
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
    log: ['error', 'warn'],
  });
  
  try {
    // Calculate the date 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    console.log(`Checking users created after: ${twentyFourHoursAgo.toLocaleString()}\n`);
    
    // Count all users created in the last 24 hours
    const totalRecentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });
    
    // Count students (role = "USER") created in the last 24 hours
    const recentStudents = await prisma.user.count({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
        role: 'USER',
      },
    });
    
    // Count teachers created in the last 24 hours
    const recentTeachers = await prisma.user.count({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
        role: 'TEACHER',
      },
    });
    
    // Count admins created in the last 24 hours
    const recentAdmins = await prisma.user.count({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
        role: 'ADMIN',
      },
    });
    
    // Get detailed list of students created in the last 24 hours
    const recentStudentsList = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
        role: 'USER',
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        createdAt: true,
        grade: true,
        division: true,
        governorate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Display results
    console.log('📊 Summary:');
    console.log('─'.repeat(50));
    console.log(`Total Users (All Roles):     ${totalRecentUsers}`);
    console.log(`Students (USER):             ${recentStudents}`);
    console.log(`Teachers (TEACHER):          ${recentTeachers}`);
    console.log(`Admins (ADMIN):              ${recentAdmins}`);
    console.log('─'.repeat(50));
    console.log('');
    
    if (recentStudents > 0) {
      console.log(`📋 List of ${recentStudents} Students Created in Last 24 Hours:`);
      console.log('─'.repeat(80));
      console.log(
        'Name'.padEnd(25) +
        'Phone'.padEnd(15) +
        'Grade'.padEnd(10) +
        'Division'.padEnd(15) +
        'Created At'
      );
      console.log('─'.repeat(80));
      
      recentStudentsList.forEach((student, index) => {
        const name = (student.fullName || 'N/A').substring(0, 24).padEnd(25);
        const phone = (student.phoneNumber || 'N/A').substring(0, 14).padEnd(15);
        const grade = (student.grade || 'N/A').substring(0, 9).padEnd(10);
        const division = (student.division || 'N/A').substring(0, 14).padEnd(15);
        const createdAt = new Date(student.createdAt).toLocaleString();
        
        console.log(`${name}${phone}${grade}${division}${createdAt}`);
      });
      
      console.log('─'.repeat(80));
    } else {
      console.log('ℹ️  No students created in the last 24 hours.');
    }
    
    // Additional statistics
    console.log('\n📈 Additional Statistics:');
    console.log('─'.repeat(50));
    
    // Count by hour (last 24 hours)
    const hourlyStats = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date();
      hourStart.setHours(hourStart.getHours() - i);
      hourStart.setMinutes(0);
      hourStart.setSeconds(0);
      hourStart.setMilliseconds(0);
      
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);
      
      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: hourStart,
            lt: hourEnd,
          },
          role: 'USER',
        },
      });
      
      if (count > 0) {
        hourlyStats.push({
          hour: hourStart.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' }),
          count,
        });
      }
    }
    
    if (hourlyStats.length > 0) {
      console.log('\nHourly Breakdown (Students):');
      hourlyStats.forEach(({ hour, count }) => {
        console.log(`  ${hour}: ${count} student(s)`);
      });
    }
    
    await prisma.$disconnect();
    console.log('\n✓ Report completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error generating report!');
    console.error('Error:', error.message);
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

countRecentUsers();

