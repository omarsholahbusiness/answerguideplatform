import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { translations } from "@/lib/translations";

// GET all promocodes - for teachers and admins
export async function GET(req: NextRequest) {
    try {
        const { userId, user } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only teachers and admins can access promocodes
        if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Check if promoCode exists on db object
        if (!db.promoCode) {
            console.error("[PROMOCODES_GET] db.promoCode is undefined. Available models:", Object.keys(db).filter(key => !key.startsWith('$')));
            return new NextResponse(
                JSON.stringify({ error: "Database model not available. Please restart the server." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Try to include course relation, but handle if it fails (Prisma client might not be regenerated)
        let promocodes;
        try {
            promocodes = await db.promoCode.findMany({
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
        } catch (includeError) {
            // If include fails, try without it (for backward compatibility)
            console.warn("[PROMOCODES_GET] Failed to include course relation, fetching without it:", includeError);
            promocodes = await db.promoCode.findMany({
                orderBy: {
                    createdAt: "desc",
                },
            });
        }

        return NextResponse.json(promocodes);
    } catch (error) {
        console.error("[PROMOCODES_GET] Error details:", error);
        if (error instanceof Error) {
            console.error("[PROMOCODES_GET] Error message:", error.message);
            console.error("[PROMOCODES_GET] Error stack:", error.stack);
            return new NextResponse(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST create new promocode - for teachers and admins
export async function POST(req: NextRequest) {
    try {
        const { userId, user } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only teachers and admins can create promocodes
        if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { code, courseId } = body;

        // Validate required fields
        if (!code || !courseId) {
            return new NextResponse(
                JSON.stringify({ error: "رمز الكوبون والكورس مطلوبان" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Validate course exists
        const course = await db.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            return new NextResponse(
                JSON.stringify({ error: "الكورس المحدد غير موجود" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if promoCode exists on db object
        if (!db.promoCode) {
            console.error("[PROMOCODES_POST] db.promoCode is undefined. Available models:", Object.keys(db).filter(key => !key.startsWith('$')));
            return new NextResponse(
                JSON.stringify({ error: "Database model not available. Please restart the server." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if code already exists
        const existingCode = await db.promoCode.findUnique({
            where: { code: code.toUpperCase().trim() },
        });

        if (existingCode) {
            const cookieStore = await cookies();
            const language = (cookieStore.get("language")?.value as "ar" | "en") || "ar";
            const t = translations[language];
            return new NextResponse(
                JSON.stringify({ error: t.promocodeAlreadyExists }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Create promocode - all promo codes are 100% discount, single use, for specific course
        const promocode = await db.promoCode.create({
            data: {
                code: code.toUpperCase().trim(),
                discountType: "PERCENTAGE",
                discountValue: 100,
                usageLimit: 1,
                isActive: true,
                courseId: courseId,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        return NextResponse.json(promocode);
    } catch (error) {
        console.error("[PROMOCODES_POST]", error);
        if (error instanceof Error) {
            return new NextResponse(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
