import { IconBadge } from "@/components/icon-badge";
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { LayoutDashboard } from "lucide-react";
import { redirect } from "next/navigation";
import { TitleForm } from "./_components/title-form";
import { DescriptionForm } from "./_components/description-form";
import { ImageForm } from "./_components/image-form";
import { PriceForm } from "./_components/price-form";
import { CourseGradeDivisionForm } from "./_components/course-grade-division-form";
import { CourseContentForm } from "./_components/course-content-form";
import { Banner } from "@/components/banner";
import { Actions } from "./_components/actions";
import { CourseIdPageContent } from "./_components/course-id-page-content";

const isStaff = (role?: string | null) => role === "ADMIN" || role === "TEACHER";

export default async function CourseIdPage({
    params,
}: {
    params: Promise<{ courseId: string }>
}) {
    const resolvedParams = await params;
    const { courseId } = resolvedParams;

    const { userId, user } = await auth();

    if (!userId) {
        return redirect("/");
    }

    const course = await db.course.findUnique({
        where: {
            id: courseId,
        },
        include: {
            chapters: {
                orderBy: {
                    position: "asc",
                },
            },
            quizzes: {
                orderBy: {
                    position: "asc",
                },
            },
        }
    });

    if (!course) {
        return redirect("/");
    }

    if (!isStaff(user?.role)) {
        return redirect("/dashboard");
    }

    // Check if grade is set
    const hasGrade = !!course.grade;

    const requiredFields = [
        course.title,
        course.description,
        course.imageUrl,
        course.price,
        course.chapters.some(chapter => chapter.isPublished),
        hasGrade
    ];

    const totalFields = requiredFields.length;
    const completedFields = requiredFields.filter(Boolean).length;

    const completionText = `(${completedFields}/${totalFields})`;

    const isComplete = requiredFields.every(Boolean);

    // Create detailed completion status
    const completionStatus = {
        title: !!course.title,
        description: !!course.description,
        imageUrl: !!course.imageUrl,
        price: course.price !== null && course.price !== undefined,
        publishedChapters: course.chapters.some(chapter => chapter.isPublished),
        grade: hasGrade
    };

    return (
        <CourseIdPageContent
            course={course}
            courseId={courseId}
            completionText={completionText}
            isComplete={isComplete}
            completionStatus={completionStatus}
        />
    );
}