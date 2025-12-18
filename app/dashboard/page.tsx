import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getDashboardUrlByRole } from "@/lib/utils";
import { DashboardContent } from "./_components/dashboard-content";
import { Course, Purchase, Chapter } from "@prisma/client";

type CourseWithProgress = Course & {
  chapters: { id: string }[];
  quizzes: { id: string }[];
  purchases: Purchase[];
  progress: number;
}

type LastWatchedChapter = {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  courseImageUrl: string | null;
  position: number;
}

type StudentStats = {
  totalCourses: number;
  totalChapters: number;
  completedChapters: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  balance: number;
}

const CoursesPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/");
  }

  // Redirect non-students to their role-specific dashboard
  if (session.user.role !== "USER") {
    const dashboardUrl = getDashboardUrlByRole(session.user.role);
    return redirect(dashboardUrl);
  }

  // Batch all initial queries in parallel for better performance
  const [
    user,
    lastWatchedChapter,
    totalCourses,
    totalChapters,
    completedChapters,
    totalQuizzes,
    allQuizResults
  ] = await Promise.all([
    // Get user's current balance
    db.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    }),
    // Get last watched chapter
    db.userProgress.findFirst({
      where: {
        userId: session.user.id,
        isCompleted: false
      },
      include: {
        chapter: {
          include: {
            course: {
              select: {
                title: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    }),
    // Get student statistics - batch all count queries
    db.purchase.count({
      where: {
        userId: session.user.id,
        status: "ACTIVE"
      }
    }),
    db.userProgress.count({
      where: {
        userId: session.user.id
      }
    }),
    db.userProgress.count({
      where: {
        userId: session.user.id,
        isCompleted: true
      }
    }),
    // Get total quizzes from courses the student has purchased
    db.quiz.count({
      where: {
        course: {
          purchases: {
            some: {
              userId: session.user.id,
              status: "ACTIVE"
            }
          }
        },
      isPublished: true
      }
    }),
    // Get all quiz results in one query (replaces two separate queries)
    db.quizResult.findMany({
      where: {
        studentId: session.user.id
      },
      select: {
        quizId: true,
        percentage: true
      },
      orderBy: {
        percentage: 'desc'
      }
    })
  ]);

  // Process quiz results to get completed quizzes and average score
  const uniqueQuizIds = new Set(allQuizResults.map(result => result.quizId));
  const completedQuizzes = uniqueQuizIds.size;

  // Get only the best attempt for each quiz
  const bestAttempts = new Map();
  allQuizResults.forEach(result => {
    if (!bestAttempts.has(result.quizId)) {
      bestAttempts.set(result.quizId, result.percentage);
    }
  });

  const averageScore = bestAttempts.size > 0 
    ? Math.round(Array.from(bestAttempts.values()).reduce((sum, percentage) => sum + percentage, 0) / bestAttempts.size)
    : 0;

  const studentStats: StudentStats = {
    totalCourses,
    totalChapters,
    completedChapters,
    totalQuizzes,
    completedQuizzes,
    averageScore
  };

  // Get all courses with their chapters and quizzes
  const courses = await db.course.findMany({
    where: {
      purchases: {
        some: {
          userId: session.user.id,
          status: "ACTIVE"
        }
      }
    },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      createdAt: true,
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
      purchases: {
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: "desc",
    }
  });

  // Batch all progress queries to avoid N+1 problem
  // Collect all chapter and quiz IDs
  const allChapterIds: string[] = [];
  const allQuizIds: string[] = [];
  courses.forEach(course => {
    allChapterIds.push(...course.chapters.map(ch => ch.id));
    allQuizIds.push(...course.quizzes.map(q => q.id));
  });

  // Get all completed chapters and quizzes in parallel
  const [completedChaptersData, completedQuizzesData] = await Promise.all([
    // Get all completed chapters for all courses at once
    allChapterIds.length > 0 ? db.userProgress.findMany({
      where: {
        userId: session.user.id,
        chapterId: { in: allChapterIds },
        isCompleted: true
      },
      select: {
        chapterId: true
      }
    }) : Promise.resolve([]),
    // Get all completed quizzes for all courses at once
    allQuizIds.length > 0 ? db.quizResult.findMany({
      where: {
        studentId: session.user.id,
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

  // Calculate progress for each course using the pre-fetched data
  const coursesWithProgress = courses.map((course) => {
    const totalChapters = course.chapters.length;
    const totalQuizzes = course.quizzes.length;
    const totalContent = totalChapters + totalQuizzes;

    // Count completed chapters and quizzes from pre-fetched data
    const completedChapters = course.chapters.filter(ch => completedChapterIds.has(ch.id)).length;
    const completedQuizzes = course.quizzes.filter(q => completedQuizIds.has(q.id)).length;

    const completedContent = completedChapters + completedQuizzes;
    const progress = totalContent > 0 
      ? (completedContent / totalContent) * 100 
      : 0;

    return {
      ...course,
      progress
    } as CourseWithProgress;
  });

  // Transform last watched chapter data
  const lastWatchedChapterData = lastWatchedChapter ? {
    id: lastWatchedChapter.chapter.id,
    title: lastWatchedChapter.chapter.title,
    courseId: lastWatchedChapter.chapter.courseId,
    courseTitle: lastWatchedChapter.chapter.course.title,
    courseImageUrl: lastWatchedChapter.chapter.course.imageUrl,
    position: lastWatchedChapter.chapter.position,
    watchedAt: lastWatchedChapter.updatedAt
  } : null;

  const studentStatsWithBalance: StudentStats & { balance: number } = {
    ...studentStats,
    balance: user?.balance || 0
  };

  return (
    <DashboardContent 
      studentStats={studentStatsWithBalance}
      lastWatchedChapter={lastWatchedChapterData}
      coursesWithProgress={coursesWithProgress.map(course => ({
        id: course.id,
        title: course.title,
        imageUrl: course.imageUrl,
        chapters: course.chapters,
        quizzes: course.quizzes,
        progress: course.progress
      }))}
    />
  );
}

export default CoursesPage; 