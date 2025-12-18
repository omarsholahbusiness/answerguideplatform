import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        const { title } = await req.json();

        if(!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const course = await db.course.create({
            data: {
                userId,
                title,
            }
        });

        return NextResponse.json(course);

    } catch (error) {
        console.log("[Courses]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeProgress = searchParams.get('includeProgress') === 'true';
    
    // Try to get user, but don't fail if not authenticated
    let userId = null;
    let student = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
      
      // Get student's grade for filtering
      if (userId) {
        student = await db.user.findUnique({
          where: { id: userId },
          select: { grade: true, role: true }
        });
      }
    } catch (error) {
      // User is not authenticated, which is fine for the home page
      console.log("User not authenticated, showing courses without progress");
    }

    // Build where clause for course filtering
    // If user is a student, filter by grade only
    // If course has no grade (old courses), show to everyone (backward compatibility)
    // If user is teacher/admin or not authenticated, show all published courses
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
        user: true,
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          }
        },
        quizzes: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          }
        },
        purchases: includeProgress && userId ? {
          where: {
            userId: userId,
            status: "ACTIVE"
          }
        } : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (includeProgress && userId) {
      // Batch all progress queries to avoid N+1 problem
      // Collect all chapter and quiz IDs from all courses
      const allChapterIds: string[] = [];
      const allQuizIds: string[] = [];
      courses.forEach(course => {
        if (course.purchases && course.purchases.length > 0) {
          allChapterIds.push(...course.chapters.map(ch => ch.id));
          allQuizIds.push(...course.quizzes.map(q => q.id));
        }
      });

      // Get all completed chapters and quizzes in parallel (one query each instead of N queries)
      const [completedChaptersData, completedQuizzesData] = await Promise.all([
        allChapterIds.length > 0 ? db.userProgress.findMany({
          where: {
            userId,
            chapterId: { in: allChapterIds },
            isCompleted: true
          },
          select: {
            chapterId: true
          }
        }) : Promise.resolve([]),
        allQuizIds.length > 0 ? db.quizResult.findMany({
          where: {
            studentId: userId,
            quizId: { in: allQuizIds }
          },
          select: {
            quizId: true
          }
        }) : Promise.resolve([])
      ]);

      // Create sets for fast lookup
      const completedChapterIds = new Set(completedChaptersData.map(c => c.chapterId));
      const completedQuizIds = new Set(completedQuizzesData.map(q => q.quizId));

      // Calculate progress for each course using pre-fetched data
      const coursesWithProgress = courses.map((course) => {
        const totalChapters = course.chapters.length;
        const totalQuizzes = course.quizzes.length;
        const totalContent = totalChapters + totalQuizzes;

        let completedChapters = 0;
        let completedQuizzes = 0;

        if (course.purchases && course.purchases.length > 0) {
          // Count from pre-fetched data instead of making new queries
          completedChapters = course.chapters.filter(ch => completedChapterIds.has(ch.id)).length;
          completedQuizzes = course.quizzes.filter(q => completedQuizIds.has(q.id)).length;
        }

        const completedContent = completedChapters + completedQuizzes;
        const progress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;

        return {
          ...course,
          progress
        };
      });

      return NextResponse.json(coursesWithProgress);
    }

    // For unauthenticated users, return courses without progress
    const coursesWithoutProgress = courses.map(course => ({
      ...course,
      progress: 0
    }));

    return NextResponse.json(coursesWithoutProgress);
  } catch (error) {
    console.log("[COURSES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}