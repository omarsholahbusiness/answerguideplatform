import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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

    const courses = await db.course.findMany({
      where: whereClause,
      include: {
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
        purchases: {
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return courses with default progress of 0 for public view
    const coursesWithDefaultProgress = courses.map(({ purchases, ...course }) => ({
      ...course,
      progress: 0,
      enrollmentCount: purchases.length,
    }));

    return NextResponse.json(coursesWithDefaultProgress);
  } catch (error) {
    console.error("[COURSES_PUBLIC]", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[COURSES_PUBLIC] Error details:", errorMessage);
    
    // If the table doesn't exist or there's a database connection issue,
    // return an empty array instead of an error
    if (error instanceof Error && (
      error.message.includes("does not exist") || 
      error.message.includes("P2021") ||
      error.message.includes("table") ||
      error.message.includes("too many") ||
      error.message.includes("connection")
    )) {
      console.error("[COURSES_PUBLIC] Database connection issue, returning empty array");
      return NextResponse.json([]);
    }
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal Error", 
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
} 