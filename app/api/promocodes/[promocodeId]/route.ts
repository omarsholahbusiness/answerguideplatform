import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { translations } from "@/lib/translations";

// GET single promocode
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ promocodeId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only teachers and admins can access promocodes
        if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Check if promoCode exists on db object
        if (!db.promoCode) {
            console.error("[PROMOCODE_GET] db.promoCode is undefined. Available models:", Object.keys(db).filter(key => !key.startsWith('$')));
            return new NextResponse(
                JSON.stringify({ error: "Database model not available. Please restart the server." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const promocode = await db.promoCode.findUnique({
            where: { id: resolvedParams.promocodeId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        if (!promocode) {
            return new NextResponse("Promocode not found", { status: 404 });
        }

        return NextResponse.json(promocode);
    } catch (error) {
        console.error("[PROMOCODE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PATCH update promocode
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ promocodeId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only teachers and admins can update promocodes
        if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { code, courseId } = body;

        // Check if promocode exists
        const existingPromocode = await db.promoCode.findUnique({
            where: { id: resolvedParams.promocodeId },
        });

        if (!existingPromocode) {
            return new NextResponse("Promocode not found", { status: 404 });
        }

        // Validate courseId is required
        if (!courseId) {
            return new NextResponse(
                JSON.stringify({ error: "الكورس مطلوب" }),
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

        // If code is being changed, check if new code already exists
        if (code && code !== existingPromocode.code) {
            const codeExists = await db.promoCode.findUnique({
                where: { code: code.toUpperCase().trim() },
            });

            if (codeExists) {
                const cookieStore = await cookies();
                const language = (cookieStore.get("language")?.value as "ar" | "en") || "ar";
                const t = translations[language];
                return new NextResponse(
                    JSON.stringify({ error: t.promocodeAlreadyExists }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }
        }

        // Build update data - only allow changing code and courseId
        // All promo codes are 100% discount, single use
        const updateData: any = {
            discountType: "PERCENTAGE",
            discountValue: 100,
            usageLimit: 1,
            isActive: true,
        };
        if (code !== undefined) updateData.code = code.toUpperCase().trim();
        if (courseId !== undefined) updateData.courseId = courseId;

        const promocode = await db.promoCode.update({
            where: { id: resolvedParams.promocodeId },
            data: updateData,
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
        console.error("[PROMOCODE_PATCH]", error);
        if (error instanceof Error) {
            return new NextResponse(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE promocode
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ promocodeId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only teachers and admins can delete promocodes
        if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const promocode = await db.promoCode.findUnique({
            where: { id: resolvedParams.promocodeId },
        });

        if (!promocode) {
            return new NextResponse("Promocode not found", { status: 404 });
        }

        await db.promoCode.delete({
            where: { id: resolvedParams.promocodeId },
        });

        return NextResponse.json({ message: "تم حذف الكوبون بنجاح" });
    } catch (error) {
        console.error("[PROMOCODE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
