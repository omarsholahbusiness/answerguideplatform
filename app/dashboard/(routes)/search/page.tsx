import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { SearchInput } from "./_components/search-input";
import { SearchContent } from "./_components/search-content";
import { SearchInputFallback } from "./_components/search-input-fallback";
import { Course, Purchase } from "@prisma/client";

type CourseWithDetails = Course & {
    chapters: { id: string }[];
    purchases: Purchase[];
    _count: {
        purchases: number;
    };
    progress: number;
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return redirect("/");
    }

    const resolvedParams = await searchParams;
    const title = typeof resolvedParams.title === 'string' ? resolvedParams.title : '';

    // Get user's grade and division for filtering
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { grade: true, division: true, role: true }
    });

    console.log("[SEARCH_PAGE] User data:", { 
        userId: session.user.id, 
        role: user?.role, 
        grade: user?.grade, 
        division: user?.division,
        title 
    });

    // Build where clause - filter by user's grade/division if they're a student
    let whereClause: any = {
        isPublished: true,
    };

    // Add title filter if exists
    if (title) {
        whereClause.title = {
            contains: title,
            mode: 'insensitive' as const
        };
    }

    // Filter by student's grade if they're a regular user
    // If user is teacher/admin, show all courses
    if (user && user.role === "USER" && user.grade) {
        // Build the filter for courses:
        // 1. Courses with grade="الكل" - show to everyone
        // 2. Courses with matching grade
        const gradeFilter = {
            OR: [
                // Courses for all grades
                { grade: "الكل" },
                // Courses matching student's grade
                { grade: user.grade }
            ]
        };

        // Build AND clause to combine isPublished, title (if exists), and grade filter
        const andConditions: any[] = [
            { isPublished: true },
            gradeFilter
        ];

        if (title) {
            andConditions.push({
                title: {
                    contains: title,
                    mode: 'insensitive' as const
                }
            });
        }

        whereClause = {
            AND: andConditions
        };
    }

    console.log("[SEARCH_PAGE] Where clause:", JSON.stringify(whereClause, null, 2));

    const courses = await db.course.findMany({
        where: whereClause,
        include: {
            chapters: {
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
                }
            },
            _count: {
                select: {
                    purchases: true,
                }
            }
        },
        orderBy: {
            createdAt: "desc",
        }
    });

    console.log("[SEARCH_PAGE] Found courses:", courses.length);
    if (courses.length > 0) {
        console.log("[SEARCH_PAGE] Sample course:", {
            id: courses[0].id,
            title: courses[0].title,
            grade: courses[0].grade,
            division: courses[0].division,
            isPublished: courses[0].isPublished
        });
    }

    const coursesWithProgress = await Promise.all(
        courses.map(async (course) => {
            const totalChapters = course.chapters.length;
            const completedChapters = await db.userProgress.count({
                where: {
                    userId: session.user.id,
                    chapterId: {
                        in: course.chapters.map(chapter => chapter.id)
                    },
                    isCompleted: true
                }
            });

            const progress = totalChapters > 0 
                ? (completedChapters / totalChapters) * 100 
                : 0;

            return {
                ...course,
                progress
            } as CourseWithDetails;
        })
    );

    return (
        <div className="p-6 space-y-6">
            {/* Search Input Section */}
            <div className="bg-card rounded-2xl p-6 border shadow-sm">
                <div className="max-w-2xl mx-auto">
                    <Suspense fallback={
                        <SearchInputFallback />
                    }>
                        <SearchInput />
                    </Suspense>
                </div>
            </div>

            {/* Results Section - Client Component */}
            <SearchContent 
                title={title}
                coursesWithProgress={coursesWithProgress.map(course => ({
                    id: course.id,
                    title: course.title,
                    imageUrl: course.imageUrl,
                    price: course.price,
                    chapters: course.chapters,
                    purchases: course.purchases,
                    _count: course._count,
                    progress: course.progress,
                    updatedAt: course.updatedAt
                }))}
                userGrade={user?.grade || null}
                userRole={user?.role || null}
            />
        </div>
    );
}