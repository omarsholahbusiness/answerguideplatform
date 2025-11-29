import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ courseId: string; chapterId: string; attachmentId: string }> }
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

        await db.chapterAudioAttachment.delete({
            where: {
                id: resolvedParams.attachmentId,
                chapterId: resolvedParams.chapterId,
            }
        });

        return new NextResponse(null, { status: 200 });
    } catch (error) {
        console.log("[CHAPTER_AUDIO_ATTACHMENT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

