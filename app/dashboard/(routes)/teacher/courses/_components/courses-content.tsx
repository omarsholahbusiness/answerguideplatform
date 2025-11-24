"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CoursesTable } from "./courses-table";
import { useColumns } from "./columns";
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

interface CoursesContentProps {
    courses: Course[];
}

export function CoursesContent({ courses }: CoursesContentProps) {
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    const columns = useColumns();

    const unpublishedCourses = courses.filter(course => !course.isPublished);
    const hasUnpublishedCourses = unpublishedCourses.length > 0;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t("manageCourses")}</h1>
                <Link href="/dashboard/teacher/courses/create">
                    <Button className="bg-[#005bd3] hover:bg-[#005bd3]/90 text-white">
                        <PlusCircle className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
                        {t("createNewCourse")}
                    </Button>
                </Link>
            </div>

            {hasUnpublishedCourses && (
                <Alert className="mt-6 border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                        <div className="mb-2">
                            <strong>{t("toPublishCourses")}</strong>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>{t("addCourseTitle")}</li>
                            <li>{t("addCourseDescription")}</li>
                            <li>{t("addCourseImage")}</li>
                            <li>{t("addPublishedChapter")}</li>
                            <li>{t("clickPublishButton")}</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            <div className="mt-6">
                <CoursesTable columns={columns} data={courses} />
            </div>
        </div>
    );
}

