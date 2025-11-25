import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Generates a unique 6-character code with uppercase letters and numbers
 * No duplicate characters within the code
 */
async function generateUniqueCode(existingCodes: string[] = []): Promise<string> {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const maxAttempts = 100;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const availableChars = characters.split("");
        const codeChars: string[] = [];

        // Select 6 unique characters
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * availableChars.length);
            const selectedChar = availableChars[randomIndex];
            codeChars.push(selectedChar);
            // Remove the selected character to ensure no duplicates
            availableChars.splice(randomIndex, 1);
        }

        const generatedCode = codeChars.join("");

        // Check if code already exists in database
        const existingCode = await db.promoCode.findUnique({
            where: { code: generatedCode },
        });

        // Also check against provided existing codes array
        if (!existingCode && !existingCodes.includes(generatedCode)) {
            return generatedCode;
        }
    }

    // Fallback: if we can't generate a unique code, throw error
    throw new Error("Unable to generate unique code after multiple attempts");
}

// POST create multiple promocodes in bulk
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
        const { courseId, quantity } = body;

        // Validate required fields
        if (!courseId) {
            return new NextResponse(
                JSON.stringify({ error: "الكورس مطلوب" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Validate quantity
        const qty = parseInt(quantity);
        if (!qty || qty < 1 || qty > 99) {
            return new NextResponse(
                JSON.stringify({ error: "العدد يجب أن يكون بين 1 و 99" }),
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

        // Get all existing codes to avoid duplicates
        const allExistingCodes = await db.promoCode.findMany({
            select: { code: true },
        });
        const existingCodesList = allExistingCodes.map(c => c.code);

        // Generate all codes
        const codesToCreate: string[] = [];
        const generatedCodes: string[] = [];

        for (let i = 0; i < qty; i++) {
            try {
                const newCode = await generateUniqueCode([...existingCodesList, ...generatedCodes]);
                codesToCreate.push(newCode);
                generatedCodes.push(newCode);
            } catch (error) {
                console.error(`Failed to generate code ${i + 1}:`, error);
                return new NextResponse(
                    JSON.stringify({ error: `فشل في إنشاء الكود رقم ${i + 1}` }),
                    { status: 500, headers: { "Content-Type": "application/json" } }
                );
            }
        }

        // Create all promocodes in a transaction
        const createdCodes = await db.$transaction(
            codesToCreate.map(code => 
                db.promoCode.create({
                    data: {
                        code: code,
                        discountType: "PERCENTAGE",
                        discountValue: 100,
                        usageLimit: 1,
                        isActive: true,
                        courseId: courseId,
                    },
                })
            )
        );

        return NextResponse.json({ 
            count: createdCodes.length,
            codes: createdCodes 
        });
    } catch (error) {
        console.error("[PROMOCODES_BULK_POST]", error);
        if (error instanceof Error) {
            return new NextResponse(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

