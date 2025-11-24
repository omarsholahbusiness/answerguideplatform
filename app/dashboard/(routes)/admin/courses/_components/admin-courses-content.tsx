"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AdminCoursesTable } from "./admin-courses-table";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface Course {
    id: string;
    title: string;
    price: number;
    isPublished: boolean;
    createdAt: Date;
    grade?: string | null;
    divisions?: string[];
    publishedChaptersCount: number;
    publishedQuizzesCount: number;
}

interface AdminCoursesContentProps {
    courses: Course[];
}

export function AdminCoursesContent({ courses }: AdminCoursesContentProps) {
    const { t } = useTranslations();
    const { isRTL } = useRTL();

    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t("allCourses")}</h1>
                <Link href="/dashboard/admin/courses/create">
                    <Button className="bg-[#005bd3] hover:bg-[#005bd3]/90 text-white">
                        <PlusCircle className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
                        {t("createNewCourse")}
                    </Button>
                </Link>
            </div>

            <div className="mt-6">
                <AdminCoursesTable courses={courses} />
            </div>
        </div>
    );
}

