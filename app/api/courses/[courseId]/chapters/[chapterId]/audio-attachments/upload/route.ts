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

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new NextResponse("No file provided", { status: 400 });
        }

        // Use Base64 encoding to store audio recordings directly in the database
        // This is simple and works immediately without any external services
        console.log("[UPLOAD] Starting base64 encoding, file:", {
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        try {
            // Check file size - base64 increases size by ~33%, so limit to 10MB original
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB for base64 storage.`);
            }
            
            // Convert File to ArrayBuffer, then to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Convert Buffer to Base64 string
            const base64String = buffer.toString('base64');
            
            // Create a data URL: data:[mime-type];base64,[base64-string]
            const mimeType = file.type || 'audio/webm';
            const dataUrl = `data:${mimeType};base64,${base64String}`;
            
            console.log("[UPLOAD] Base64 encoding complete. Size:", {
                original: `${(file.size / 1024).toFixed(2)} KB`,
                base64: `${(dataUrl.length / 1024).toFixed(2)} KB`,
                increase: `${((dataUrl.length / file.size - 1) * 100).toFixed(1)}%`
            });

            // Return the data URL - this will be stored in the database
            return NextResponse.json({ 
                url: dataUrl, 
                name: file.name 
            });
        } catch (uploadError) {
            console.error("[UPLOAD] Upload error:", uploadError);
            console.error("[UPLOAD] Error type:", typeof uploadError);
            console.error("[UPLOAD] Error constructor:", uploadError?.constructor?.name);
            
            if (uploadError instanceof Error) {
                console.error("[UPLOAD] Error message:", uploadError.message);
                console.error("[UPLOAD] Error stack:", uploadError.stack);
            }
            
            throw new Error(`Upload failed: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
        }
    } catch (error) {
        console.error("[CHAPTER_AUDIO_ATTACHMENT_UPLOAD_RECORDING] Full error:", error);
        console.error("[CHAPTER_AUDIO_ATTACHMENT_UPLOAD_RECORDING] Error stack:", error instanceof Error ? error.stack : "No stack");
        console.error("[CHAPTER_AUDIO_ATTACHMENT_UPLOAD_RECORDING] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        return new NextResponse(
            JSON.stringify({ 
                error: "Internal Error", 
                message: errorMessage,
                stack: process.env.NODE_ENV === "development" ? errorStack : undefined
            }), 
            { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}

