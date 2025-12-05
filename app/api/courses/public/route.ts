import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Cache the response for 5 minutes to improve performance
export const revalidate = 300;
export const dynamic = 'force-dynamic'; // Allow per-request filtering

export async function GET() {
  try {
    // Try to get user for filtering (non-blocking - don't wait if it fails)
    let userId = null;
    let student = null;
    
    // Use Promise.race to timeout auth check quickly
    try {
      const authPromise = auth();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 2000)
      );
      
      const authResult = await Promise.race([authPromise, timeoutPromise]) as any;
      userId = authResult?.userId;
      
      if (userId) {
        // Fetch student info with timeout
        const studentPromise = db.user.findUnique({
          where: { id: userId },
          select: { grade: true, role: true }
        });
        const studentTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Student fetch timeout')), 1000)
        );
        
        student = await Promise.race([studentPromise, studentTimeout]) as any;
      }
    } catch (error) {
      // User not authenticated or timeout - continue without filtering (faster)
      // This allows the page to load quickly even if auth is slow
    }

    // Build where clause - same filtering logic as main courses API
    const whereClause: any = {
      isPublished: true,
    };

    // Filter by student's grade if they're a regular user
    if (student && student.role === "USER" && student.grade) {
      whereClause.OR = [
        // Courses for all grades (الكل)
        { grade: "الكل" },
        // Courses matching student's grade
        { grade: student.grade },
        // Old courses: no grade set yet (backward compatibility)
        {
          grade: null
        }
      ];
    }

    // Optimized query: fetch courses with minimal data
    // Use take to limit results if needed (adjust based on your needs)
    const courses = await db.course.findMany({
      where: whereClause,
      take: 50, // Limit to 50 courses max for better performance
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          },
          take: 1, // Only need first chapter ID for navigation
        },
        quizzes: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          },
          take: 1, // Only need count, not all quiz IDs
        },
        _count: {
          select: {
            purchases: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return courses with default progress of 0 for public view
    // Use _count instead of loading all purchases for better performance
    const coursesWithDefaultProgress = courses.map(({ _count, ...course }) => ({
      ...course,
      progress: 0,
      enrollmentCount: _count.purchases,
    }));

    // Add caching headers for better performance
    return NextResponse.json(coursesWithDefaultProgress, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("[COURSES_PUBLIC] Full error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[COURSES_PUBLIC] Error message:", errorMessage);
    if (errorStack) {
      console.error("[COURSES_PUBLIC] Error stack:", errorStack);
    }
    
    // Check for Prisma error codes
    const prismaErrorCode = (error as any)?.code;
    if (prismaErrorCode) {
      console.error("[COURSES_PUBLIC] Prisma error code:", prismaErrorCode);
    }
    
    // If the table doesn't exist or there's a database connection issue,
    // return an empty array instead of an error
    if (error instanceof Error && (
      error.message.includes("does not exist") || 
      error.message.includes("P2021") ||
      error.message.includes("table") ||
      error.message.includes("too many") ||
      error.message.includes("connection") ||
      error.message.includes("Can't reach database") ||
      error.message.includes("Accelerate was not able to connect") ||
      prismaErrorCode === "P1001" || // Can't reach database server
      prismaErrorCode === "P1017" || // Server has closed the connection
      prismaErrorCode === "P5000" || // Unknown error (often connection related)
      prismaErrorCode === "P6008"    // Accelerate connection error
    )) {
      console.error("[COURSES_PUBLIC] Database connection issue, returning empty array");
      console.error("[COURSES_PUBLIC] Error code:", prismaErrorCode);
      console.error("[COURSES_PUBLIC] This usually means:");
      console.error("  1. Database server is down or unreachable");
      console.error("  2. IP address not whitelisted in Aiven");
      console.error("  3. Network/firewall blocking connection");
      console.error("  4. Database credentials are incorrect");
      return NextResponse.json([]);
    }
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal Error", 
        message: errorMessage,
        code: prismaErrorCode,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
} 