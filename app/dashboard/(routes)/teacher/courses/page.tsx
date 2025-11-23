import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CoursesContent } from "./_components/courses-content";

const CoursesPage = async () => {
    const { userId, user } = await auth();

    if (!userId) {
        return redirect("/");
    }

    const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
    if (!isStaff) {
        return redirect("/");
    }

    const courses = await db.course.findMany({
        include: {
            chapters: {
                select: {
                    id: true,
                    isPublished: true,
                }
            },
            quizzes: {
                select: {
                    id: true,
                    isPublished: true,
                }
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    }).then(courses => courses.map(course => ({
        ...course,
        price: course.price || 0,
        publishedChaptersCount: course.chapters.filter(ch => ch.isPublished).length,
        publishedQuizzesCount: course.quizzes.filter(q => q.isPublished).length,
    })));

    return <CoursesContent courses={courses} />;
};

export default CoursesPage;