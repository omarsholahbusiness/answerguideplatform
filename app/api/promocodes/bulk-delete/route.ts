import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE promocodes by course or all
export async function DELETE(req: NextRequest) {
    try {
        const { userId, user } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only teachers and admins can delete promocodes
        if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { courseId } = body;

        if (!courseId) {
            return new NextResponse(
                JSON.stringify({ error: "يجب تحديد الكورس" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        let deletedCount = 0;

        try {
            if (courseId === "ALL") {
                // Soft delete all promocodes (set deletedAt for codes that aren't already deleted)
                const result = await db.promoCode.updateMany({
                    where: {
                        deletedAt: null, // Only update non-deleted codes
                    },
                    data: {
                        deletedAt: new Date(),
                    },
                });
                deletedCount = result.count;
            } else {
                // Soft delete promocodes for specific course
                const result = await db.promoCode.updateMany({
                    where: {
                        courseId: courseId,
                        deletedAt: null, // Only update non-deleted codes
                    },
                    data: {
                        deletedAt: new Date(),
                    },
                });
                deletedCount = result.count;
            }
        } catch (error: any) {
            // Check if error is related to deletedAt column not existing
            const errorMessage = error?.message || "";
            const errorCode = error?.code || "";
            
            if (
                errorCode === "P2021" || 
                errorMessage.includes("deletedAt") || 
                errorMessage.includes("Unknown column") ||
                errorMessage.includes("column") && errorMessage.includes("does not exist")
            ) {
                console.warn("[PROMOCODES_BULK_DELETE] deletedAt column not found. Migration may not be applied.");
                console.warn("[PROMOCODES_BULK_DELETE] To enable soft delete, run: npx prisma migrate dev");
                console.warn("[PROMOCODES_BULK_DELETE] Skipping delete to preserve data.");
                
                // Don't delete - return error to user
                return new NextResponse(
                    JSON.stringify({ 
                        error: "Migration not applied. Please run 'npx prisma migrate dev' to enable soft delete.",
                        warning: "Codes preserved in database to prevent data loss"
                    }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            } else {
                throw error;
            }
        }

        return NextResponse.json({
            success: true,
            count: deletedCount,
        });
    } catch (error) {
        console.error("[PROMOCODES_BULK_DELETE]", error);
        if (error instanceof Error) {
            return new NextResponse(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

