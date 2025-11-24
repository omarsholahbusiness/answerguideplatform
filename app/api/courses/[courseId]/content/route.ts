import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const resolvedParams = await params;

        // Get chapters
        const chapters = await db.chapter.findMany({
            where: {
                courseId: resolvedParams.courseId,
                isPublished: true
            },
            include: {
                userProgress: {
                    select: {
                        isCompleted: true
                    }
                }
            },
            orderBy: {
                position: "asc"
            }
        });

        // Get published quizzes
        const quizzes = await db.quiz.findMany({
            where: {
                courseId: resolvedParams.courseId,
                isPublished: true
            },
            include: {
                quizResults: {
                    select: {
                        id: true,
                        score: true,
                        totalPoints: true,
                        percentage: true
                    }
                }
            },
            orderBy: {
                position: "asc"
            }
        });

        // Combine and sort by position
        const allContent = [
            ...chapters.map(chapter => ({
                ...chapter,
                type: 'chapter' as const
            })),
            ...quizzes.map(quiz => ({
                ...quiz,
                type: 'quiz' as const
            }))
        ].sort((a, b) => a.position - b.position);

        return NextResponse.json(allContent);
    } catch (error) {
        console.error("[COURSE_CONTENT]", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("[COURSE_CONTENT] Error details:", errorMessage);
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