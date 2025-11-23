import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/utils";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!isAdmin(session.user.role)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Admin can see all users (USER, TEACHER, and ADMIN roles)
        const users = await db.user.findMany({
            where: {
                role: {
                    in: ["USER", "TEACHER", "ADMIN"]
                }
            },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                parentPhoneNumber: true,
                role: true,
                balance: true,
                grade: true,
                division: true,
                studyType: true,
                governorate: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        courses: true,
                        purchases: true,
                        userProgress: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("[ADMIN_USERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 