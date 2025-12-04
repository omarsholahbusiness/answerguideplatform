import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { translations } from "@/lib/translations";

/**
 * Generates a unique 6-character code with uppercase letters and numbers
 * No duplicate characters within the code
 */
async function generateUniqueCode(): Promise<string> {
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

        // Check if code already exists (including soft-deleted codes to prevent reuse)
        const existingCode = await db.promoCode.findUnique({
            where: { code: generatedCode },
        });

        if (!existingCode) {
            return generatedCode;
        }
    }

    // Fallback: if we can't generate a unique code, throw error
    throw new Error("Unable to generate unique code after multiple attempts");
}

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

        // Fetch promocodes with course relation (exclude soft-deleted codes)
        let promocodes;
        try {
            // Try to fetch with deletedAt filter (if migration has been applied)
            try {
                promocodes = await db.promoCode.findMany({
                    where: {
                        deletedAt: null, // Only get non-deleted codes
                    },
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
            } catch (deletedAtError: any) {
                // If deletedAt column doesn't exist yet (migration not applied), fetch all codes
                if (deletedAtError?.message?.includes("deletedAt") || deletedAtError?.code === "P2021") {
                    console.warn("[PROMOCODES_GET] deletedAt column not found, fetching all codes (migration may not be applied)");
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
                } else {
                    throw deletedAtError;
                }
            }
        } catch (includeError) {
            // If include fails, try without it (for backward compatibility)
            console.warn("[PROMOCODES_GET] Failed to include course relation, fetching without it:", includeError);
            try {
                promocodes = await db.promoCode.findMany({
                    where: {
                        deletedAt: null, // Only get non-deleted codes
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });
            } catch (deletedAtError2: any) {
                // If deletedAt column doesn't exist yet, fetch all codes
                if (deletedAtError2?.message?.includes("deletedAt") || deletedAtError2?.code === "P2021") {
                    console.warn("[PROMOCODES_GET] deletedAt column not found, fetching all codes");
                    promocodes = await db.promoCode.findMany({
                        orderBy: {
                            createdAt: "desc",
                        },
                    });
                } else {
                    throw deletedAtError2;
                }
            }
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

// POST create new codeItem - for teachers and admins
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
        let { code, courseId } = body;

        // Validate required fields
        if (!courseId) {
            return new NextResponse(
                JSON.stringify({ error: "الكورس مطلوب" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // If no code provided, generate one
        if (!code || !code.trim()) {
            code = await generateUniqueCode();
        } else {
            code = code.toUpperCase().trim();
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

        // Check if code already exists (including soft-deleted codes to prevent reuse)
        const existingCode = await db.promoCode.findUnique({
            where: { code: code },
        });

        if (existingCode) {
            // If code exists (even if soft-deleted), try to generate a new one
            try {
                code = await generateUniqueCode();
            } catch (error) {
                const cookieStore = await cookies();
                const language = (cookieStore.get("language")?.value as "ar" | "en") || "ar";
                const t = translations[language];
                return new NextResponse(
                    JSON.stringify({ error: t.promocodeAlreadyExists }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }
        }

        // Create promocode - all promocodes are 100% discount, single use, for specific course
        const newPromoCode = await db.promoCode.create({
            data: {
                code: code,
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

        return NextResponse.json(newPromoCode);
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
