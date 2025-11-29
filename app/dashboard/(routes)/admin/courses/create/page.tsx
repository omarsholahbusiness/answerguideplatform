import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";

const AdminCreateCoursePage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/");
  }

  // Verify the user exists in the database
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return redirect("/sign-in");
  }

  // Get language preference from cookies, default to Arabic
  const cookieStore = await cookies();
  const language = (cookieStore.get("language")?.value as "ar" | "en") || "ar";
  const defaultTitle = translations[language].unnamedCourse;

  const course = await db.course.create({
    data: {
      userId,
      title: defaultTitle,
    },
  });

  // Reuse the teacher editor UI for course setup
  return redirect(`/dashboard/teacher/courses/${course.id}`);
};

export default AdminCreateCoursePage;
