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

        if (courseId === "ALL") {
            // Delete all promocodes
            const result = await db.promoCode.deleteMany({});
            deletedCount = result.count;
        } else {
            // Delete promocodes for specific course
            const result = await db.promoCode.deleteMany({
                where: {
                    courseId: courseId,
                },
            });
            deletedCount = result.count;
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

