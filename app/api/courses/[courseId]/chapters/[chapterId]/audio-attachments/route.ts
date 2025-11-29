import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
    try {
        const { userId } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const courseOwner = await db.course.findUnique({
            where: {
                id: resolvedParams.courseId,
                userId,
            }
        });

        if (!courseOwner) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { url, name, isRecorded } = await req.json();

        if (!url) {
            return new NextResponse("Missing URL", { status: 400 });
        }

        // Get the current position for the new attachment
        const existingAttachments = await db.chapterAudioAttachment.findMany({
            where: {
                chapterId: resolvedParams.chapterId,
            },
            orderBy: {
                position: 'desc',
            },
            take: 1,
        });

        const newPosition = existingAttachments.length > 0 
            ? existingAttachments[0].position + 1 
            : 0;

        // Create new audio attachment
        const attachment = await db.chapterAudioAttachment.create({
            data: {
                name: name || 'ملف صوتي جديد',
                url: url,
                position: newPosition,
                isRecorded: isRecorded || false,
                chapterId: resolvedParams.chapterId,
            }
        });

        return NextResponse.json(attachment);
    } catch (error) {
        console.error("[CHAPTER_AUDIO_ATTACHMENT_UPLOAD] Full error:", error);
        console.error("[CHAPTER_AUDIO_ATTACHMENT_UPLOAD] Error stack:", error instanceof Error ? error.stack : "No stack");
        
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new NextResponse(
            JSON.stringify({ 
                error: "Internal Error", 
                message: errorMessage 
            }), 
            { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
    try {
        const { userId } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const courseOwner = await db.course.findUnique({
            where: {
                id: resolvedParams.courseId,
                userId,
            }
        });

        if (!courseOwner) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const attachments = await db.chapterAudioAttachment.findMany({
            where: {
                chapterId: resolvedParams.chapterId,
            },
            orderBy: {
                position: 'asc',
            },
        });

        return NextResponse.json(attachments);
    } catch (error) {
        console.log("[CHAPTER_AUDIO_ATTACHMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

