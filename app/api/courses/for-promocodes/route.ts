import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeRole } from "@/lib/utils";

// GET all courses for promo code selection - for teachers and admins only
export async function GET(req: NextRequest) {
    try {
        const { userId, user } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only teachers and admins can access this endpoint
        const userRole = normalizeRole(user?.role);
        if (userRole !== "TEACHER" && userRole !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Get all courses (both published and unpublished) for teachers/admins
        const courses = await db.course.findMany({
            select: {
                id: true,
                title: true,
                isPublished: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(courses);
    } catch (error) {
        console.error("[COURSES_FOR_PROMOCODES]", error);
        if (error instanceof Error) {
            return new NextResponse(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

