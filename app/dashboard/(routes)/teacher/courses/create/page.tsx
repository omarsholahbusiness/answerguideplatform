import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";

const CreatePage = async () => {
    const { userId } = await auth();

    if (!userId) {
        return redirect("/");
    }

    // Get language preference from cookies, default to Arabic
    const cookieStore = await cookies();
    const language = (cookieStore.get("language")?.value as "ar" | "en") || "ar";
    const defaultTitle = translations[language].unnamedCourse;

    const course = await db.course.create({
        data: {
            userId,
            title: defaultTitle,
        }
    });

    return redirect(`/dashboard/teacher/courses/${course.id}`);
};

export default CreatePage;
