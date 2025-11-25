import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractYouTubeVideoId, isValidYouTubeUrl } from "@/lib/youtube";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // First check if course exists
        const existingCourse = await db.course.findUnique({
            where: { id: resolvedParams.courseId }
        });

        if (!existingCourse) {
            return new NextResponse("Course not found", { status: 404 });
        }

        // Check permissions:
        // - ADMIN can update any course
        // - TEACHER can only update their own courses
        // - Others cannot update
        const userRole = (user?.role || "").toUpperCase();
        const isAdmin = userRole === "ADMIN";
        const isTeacher = userRole === "TEACHER";
        const isOwner = existingCourse.userId === userId;

        // Must be ADMIN or TEACHER
        if (!isAdmin && !isTeacher) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // TEACHER can only update their own courses (unless they're also ADMIN)
        if (isTeacher && !isAdmin && !isOwner) {
            return new NextResponse("Forbidden - يمكنك تعديل كورساتك فقط", { status: 403 });
        }

        const { youtubeUrl } = await req.json();

        if (!youtubeUrl) {
            return new NextResponse("Missing YouTube URL", { status: 400 });
        }

        if (!isValidYouTubeUrl(youtubeUrl)) {
            return new NextResponse("Invalid YouTube URL", { status: 400 });
        }

        const youtubeVideoId = extractYouTubeVideoId(youtubeUrl);

        if (!youtubeVideoId) {
            return new NextResponse("Could not extract video ID", { status: 400 });
        }

        // Update chapter with YouTube video
        await db.chapter.update({
            where: {
                id: resolvedParams.chapterId,
                courseId: resolvedParams.courseId,
            },
            data: {
                videoUrl: youtubeUrl,
                videoType: "YOUTUBE",
                youtubeVideoId: youtubeVideoId,
            }
        });

        return NextResponse.json({ 
            success: true,
            youtubeVideoId,
            url: youtubeUrl
        });
    } catch (error) {
        console.log("[CHAPTER_YOUTUBE_UPLOAD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 