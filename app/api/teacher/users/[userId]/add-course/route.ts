import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStaff } from "@/lib/utils";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if user is teacher or admin
        if (!isStaff(session.user.role)) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const { userId } = await params;
        const { courseId } = await req.json();

        if (!courseId) {
            return NextResponse.json(
                { error: "Course ID is required" },
                { status: 400 }
            );
        }

        // Check if user exists and is a student
        const user = await db.user.findUnique({
            where: {
                id: userId,
                role: "USER"
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Student not found" },
                { status: 404 }
            );
        }

        // Check if course exists and is published
        const course = await db.course.findUnique({
            where: {
                id: courseId,
                isPublished: true
            }
        });

        if (!course) {
            return NextResponse.json(
                { error: "Course not found or not published" },
                { status: 404 }
            );
        }

        // Check if student already has this course
        const existingPurchase = await db.purchase.findFirst({
            where: {
                userId: userId,
                courseId: courseId,
                status: "ACTIVE"
            }
        });

        if (existingPurchase) {
            return NextResponse.json(
                { error: "Student already has this course" },
                { status: 400 }
            );
        }

        // Create purchase record
        const purchase = await db.purchase.create({
            data: {
                userId: userId,
                courseId: courseId,
                status: "ACTIVE"
            }
        });

        return NextResponse.json({
            message: "Course added successfully",
            purchase
        });

    } catch (error) {
        console.error("[TEACHER_ADD_COURSE]", error);
        return NextResponse.json(
            { error: "Internal Error" },
            { status: 500 }
        );
    }
} 

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!isStaff(session.user.role)) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const { userId } = await params;
        const { courseId } = await req.json();

        if (!courseId) {
            return NextResponse.json(
                { error: "Course ID is required" },
                { status: 400 }
            );
        }

        // Ensure student exists
        const user = await db.user.findUnique({
            where: {
                id: userId,
                role: "USER",
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Student not found" },
                { status: 404 }
            );
        }

        // Find existing purchase for this user and course
        const existingPurchase = await db.purchase.findUnique({
            where: {
                userId_courseId: {
                    userId: userId,
                    courseId,
                },
            },
        });

        if (!existingPurchase) {
            return NextResponse.json(
                { error: "Course not found for this student" },
                { status: 404 }
            );
        }

        // Delete purchase to free unique constraint for re-adding later
        await db.purchase.delete({
            where: { id: existingPurchase.id },
        });

        return NextResponse.json({ message: "Course removed successfully" });
    } catch (error) {
        console.error("[TEACHER_REMOVE_COURSE]", error);
        return NextResponse.json(
            { error: "Internal Error" },
            { status: 500 }
        );
    }
}
