import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Cache the response for 60 seconds to improve performance
export const revalidate = 60;

export async function GET() {
  try {
    // Try to get user for filtering
    let userId = null;
    let student = null;
    
    try {
      const authResult = await auth();
      userId = authResult.userId;
      
      if (userId) {
        student = await db.user.findUnique({
          where: { id: userId },
          select: { grade: true, role: true }
        });
      }
    } catch (error) {
      // User not authenticated, continue without filtering
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
    const courses = await db.course.findMany({
      where: whereClause,
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
        },
        quizzes: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          },
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

    return NextResponse.json(coursesWithDefaultProgress);
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