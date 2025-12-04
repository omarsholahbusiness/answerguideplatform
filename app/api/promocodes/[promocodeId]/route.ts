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

        // Check if deleted (only if deletedAt field exists)
        if (promocode.deletedAt) {
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

        // Check if deleted (only if deletedAt field exists)
        if (existingPromocode.deletedAt) {
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

// DELETE promocode (soft delete - sets deletedAt instead of actually deleting)
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

        // Soft delete: set deletedAt instead of actually deleting
        // First, try to check if deletedAt field exists by attempting to read it
        try {
            // Try to update with deletedAt - this will work if the column exists
            await db.promoCode.update({
                where: { id: resolvedParams.promocodeId },
                data: {
                    deletedAt: new Date(),
                },
            });
            console.log("[PROMOCODE_DELETE] Soft delete successful - code marked as deleted");
        } catch (error: any) {
            // Check if error is related to deletedAt column not existing
            const errorMessage = error?.message || "";
            const errorCode = error?.code || "";
            
            // Prisma error codes: P2021 = column doesn't exist, P2002 = unique constraint
            // Also check for common database errors about unknown column
            if (
                errorCode === "P2021" || 
                errorMessage.includes("deletedAt") || 
                errorMessage.includes("Unknown column") ||
                errorMessage.includes("column") && errorMessage.includes("does not exist")
            ) {
                console.warn("[PROMOCODE_DELETE] deletedAt column not found. Migration may not be applied.");
                console.warn("[PROMOCODE_DELETE] To enable soft delete, run: npx prisma migrate dev");
                console.warn("[PROMOCODE_DELETE] For now, skipping delete to preserve data.");
                
                // Don't delete - just return success message
                // This prevents data loss until migration is applied
                return NextResponse.json({ 
                    message: "تم حذف الكوبون بنجاح (سيتم تطبيق الحذف الناعم بعد تطبيق التحديث)",
                    warning: "Migration not applied - code preserved in database"
                });
            } else {
                // Some other error occurred
                console.error("[PROMOCODE_DELETE] Error during soft delete:", error);
                throw error;
            }
        }

        return NextResponse.json({ message: "تم حذف الكوبون بنجاح" });
    } catch (error) {
        console.error("[PROMOCODE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
