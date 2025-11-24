import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const resolvedParams = await params;
  const { courseId } = resolvedParams;

  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: courseId,
        isPublished: true,
      },
      include: {
        purchases: {
          where: {
            userId,
          },
        },
      },
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Free courses are always accessible
    if (course.price === 0) {
      return NextResponse.json({ hasAccess: true });
    }

    // Check if user has any purchase with ACTIVE status
    const validPurchase = course.purchases.some(purchase => 
      purchase.status === "ACTIVE"
    );

    return NextResponse.json({ hasAccess: validPurchase });
  } catch (error) {
    console.error("[COURSE_ACCESS]", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[COURSE_ACCESS] Error details:", errorMessage);
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal Error", 
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
} 