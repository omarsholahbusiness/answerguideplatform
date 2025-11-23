import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { translations } from "@/lib/translations";

// POST validate promocode
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { code, courseId } = body;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!code || !courseId) {
            return new NextResponse(
                JSON.stringify({ error: "رمز الكوبون ومعرف الكورس مطلوبان" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Find promocode
        const promocode = await db.promoCode.findUnique({
            where: { code: code.toUpperCase().trim() },
        });

        if (!promocode) {
            return new NextResponse(
                JSON.stringify({ error: "رمز الكوبون غير صحيح" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if promocode is active
        if (!promocode.isActive) {
            return new NextResponse(
                JSON.stringify({ error: "هذا الكوبون غير نشط" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if promo code is for this specific course
        if (promocode.courseId !== courseId) {
            const cookieStore = await cookies();
            const language = (cookieStore.get("language")?.value as "ar" | "en") || "ar";
            const t = translations[language];
            return new NextResponse(
                JSON.stringify({ error: t.promocodeNotValidForCourse }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check usage limit (single use only)
        if (promocode.usedCount >= (promocode.usageLimit || 1)) {
            return new NextResponse(
                JSON.stringify({ error: "تم استخدام هذا الكوبون من قبل" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Get course price
        const course = await db.course.findUnique({
            where: { id: courseId },
            select: { price: true },
        });

        if (!course) {
            return new NextResponse(
                JSON.stringify({ error: "الكورس غير موجود" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const coursePrice = course.price || 0;
        
        // All promo codes are 100% discount
        const discountAmount = coursePrice;
        const finalPrice = 0;

        return NextResponse.json({
            valid: true,
            promocode: {
                id: promocode.id,
                code: promocode.code,
                discountType: promocode.discountType,
                discountValue: promocode.discountValue,
                description: promocode.description,
            },
            discountAmount: discountAmount.toFixed(2),
            originalPrice: coursePrice.toFixed(2),
            finalPrice: finalPrice.toFixed(2),
        });
    } catch (error) {
        console.error("[PROMOCODE_VALIDATE]", error);
        if (error instanceof Error) {
            return new NextResponse(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
