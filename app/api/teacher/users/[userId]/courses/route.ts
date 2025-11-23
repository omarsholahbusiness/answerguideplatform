import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStaff } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;
    
    console.log("[TEACHER_USER_COURSES] Fetching courses for userId:", userId);
    
    const session = await getServerSession(authOptions);
    console.log("[TEACHER_USER_COURSES] Session:", { 
      userId: session?.user?.id, 
      role: session?.user?.role 
    });

    if (!session?.user) {
      console.log("[TEACHER_USER_COURSES] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStaff(session.user.role)) {
      console.log("[TEACHER_USER_COURSES] Forbidden - role:", session.user.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: { id: userId, role: "USER" },
    });

    if (!user) {
      console.log("[TEACHER_USER_COURSES] Student not found:", userId);
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    console.log("[TEACHER_USER_COURSES] Fetching purchases for user:", userId);
    const purchases = await db.purchase.findMany({
      where: { userId: userId, status: "ACTIVE" },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            isPublished: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("[TEACHER_USER_COURSES] Found purchases:", purchases.length);
    const ownedCourses = purchases.map((p) => p.course);

    return NextResponse.json({ courses: ownedCourses });
  } catch (error) {
    console.error("[TEACHER_USER_COURSES] Error:", error);
    if (error instanceof Error) {
      console.error("[TEACHER_USER_COURSES] Error message:", error.message);
      console.error("[TEACHER_USER_COURSES] Error stack:", error.stack);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
