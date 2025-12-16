import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ courseId: string; chapterId: string; attachmentId: string }> }
) {
    try {
        const { userId } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get the attachment
        const attachment = await db.chapterAttachment.findUnique({
            where: {
                id: resolvedParams.attachmentId,
            },
            select: {
                url: true,
                name: true,
                chapterId: true,
                chapter: {
                    select: {
                        courseId: true,
                        course: {
                            select: {
                                userId: true,
                                isPublished: true
                            }
                        }
                    }
                }
            }
        });

        if (!attachment) {
            return new NextResponse("Attachment not found", { status: 404 });
        }

        // Verify the attachment belongs to the correct chapter and course
        if (attachment.chapterId !== resolvedParams.chapterId || 
            attachment.chapter.courseId !== resolvedParams.courseId) {
            return new NextResponse("Attachment not found", { status: 404 });
        }

        // Check if user has access to the course
        const hasAccess = await db.purchase.findFirst({
            where: {
                userId,
                courseId: resolvedParams.courseId,
                status: "ACTIVE"
            }
        });

        const isCourseOwner = attachment.chapter.course.userId === userId;
        const isPublished = attachment.chapter.course.isPublished;

        if (!hasAccess && !isCourseOwner && !isPublished) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch the file from the URL
        const response = await fetch(attachment.url);
        
        if (!response.ok) {
            return new NextResponse("Failed to fetch attachment", { status: 500 });
        }

        // Get the file content and headers
        const fileBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        
        // Extract filename from URL or use stored name
        const filename = attachment.name || (() => {
            try {
                const url = new URL(attachment.url);
                const pathname = url.pathname;
                const extractedFilename = pathname.split('/').pop();
                return extractedFilename || 'attachment';
            } catch {
                return 'attachment';
            }
        })();

        // Prepare robust Content-Disposition with UTF-8 filename support
        const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_');
        const encodedFilename = encodeURIComponent(filename);

        // Derive Content-Length
        const contentLength = String(fileBuffer.byteLength);

        // Create response with download headers
        const downloadResponse = new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': contentLength,
                'Content-Disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`,
                'Cache-Control': 'no-cache',
            },
        });

        return downloadResponse;
    } catch (error) {
        console.log("[CHAPTER_ATTACHMENT_DOWNLOAD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

