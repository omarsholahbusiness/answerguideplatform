"use client";

import { IconBadge } from "@/components/icon-badge";
import { LayoutDashboard } from "lucide-react";
import { Banner } from "@/components/banner";
import { Actions } from "./actions";
import { TitleForm } from "./title-form";
import { DescriptionForm } from "./description-form";
import { ImageForm } from "./image-form";
import { PriceForm } from "./price-form";
import { CourseGradeDivisionForm } from "./course-grade-division-form";
import { CourseContentForm } from "./course-content-form";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";
import { Course, Chapter, Quiz } from "@prisma/client";

interface CourseWithRelations extends Course {
    chapters: Chapter[];
    quizzes: Quiz[];
}

interface CourseIdPageContentProps {
    course: CourseWithRelations;
    courseId: string;
    completionText: string;
    isComplete: boolean;
    completionStatus: {
        title: boolean;
        description: boolean;
        imageUrl: boolean;
        price: boolean;
        publishedChapters: boolean;
        grade: boolean;
    };
}

export const CourseIdPageContent = ({
    course,
    courseId,
    completionText,
    isComplete,
    completionStatus,
}: CourseIdPageContentProps) => {
    const { t } = useTranslations();
    const { isRTL } = useRTL();

    return (
        <>
            {!course.isPublished && (
                <Banner
                    variant="warning"
                    label={t("courseNotPublished")}
                />
            )}
            <div className="p-6">
                <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}>
                    <div className="flex flex-col gap-y-2">
                        <h1 className="text-2xl font-medium" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                            {t("setupCourse")}
                        </h1>
                        <span className="text-sm text-slate-700" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                            {t("completeAllFields")} {completionText}
                        </span>
                        {!isComplete && (
                            <div className="text-xs text-muted-foreground mt-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-1 ${completionStatus.title ? 'text-green-600' : 'text-red-600'}`}>
                                        <span>{completionStatus.title ? '✓' : '✗'}</span>
                                        <span className={isRTL ? "text-right" : "text-left"}>{t("titleLabel")}</span>
                                    </div>
                                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-1 ${completionStatus.description ? 'text-green-600' : 'text-red-600'}`}>
                                        <span>{completionStatus.description ? '✓' : '✗'}</span>
                                        <span className={isRTL ? "text-right" : "text-left"}>{t("description")}</span>
                                    </div>
                                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-1 ${completionStatus.imageUrl ? 'text-green-600' : 'text-red-600'}`}>
                                        <span>{completionStatus.imageUrl ? '✓' : '✗'}</span>
                                        <span className={isRTL ? "text-right" : "text-left"}>{t("imageLabel")}</span>
                                    </div>
                                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-1 ${completionStatus.price ? 'text-green-600' : 'text-red-600'}`}>
                                        <span>{completionStatus.price ? '✓' : '✗'}</span>
                                        <span className={isRTL ? "text-right" : "text-left"}>{t("priceLabel")}</span>
                                    </div>
                                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-1 ${completionStatus.publishedChapters ? 'text-green-600' : 'text-red-600'}`}>
                                        <span>{completionStatus.publishedChapters ? '✓' : '✗'}</span>
                                        <span className={isRTL ? "text-right" : "text-left"}>{t("publishedChapter")}</span>
                                    </div>
                                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-1 ${completionStatus.grade ? 'text-green-600' : 'text-red-600'}`}>
                                        <span>{completionStatus.grade ? '✓' : '✗'}</span>
                                        <span className={isRTL ? "text-right" : "text-left"}>{t("gradeLabel")}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <Actions
                        disabled={!isComplete}
                        courseId={courseId}
                        isPublished={course.isPublished}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
                    <div>
                        <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-x-2`}>
                            <IconBadge icon={LayoutDashboard} />
                            <h2 className={`text-xl ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                {t("customizeYourCourse")}
                            </h2>
                        </div>
                        <TitleForm
                            initialData={course}
                            courseId={course.id}
                        />
                        <DescriptionForm
                            initialData={course}
                            courseId={course.id}
                        />
                        <PriceForm
                            initialData={course}
                            courseId={course.id}
                        />
                        <CourseGradeDivisionForm
                            initialData={course}
                            courseId={course.id}
                        />
                    </div>
                    <div className="space-y-6">
                        <div>
                            <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-x-2`}>
                                <IconBadge icon={LayoutDashboard} />
                                <h2 className={`text-xl ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                    {t("resourcesAndChapters")}
                                </h2>
                            </div>
                            <CourseContentForm
                                initialData={course}
                                courseId={course.id}
                            />
                        </div>
                        <div>
                            <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-x-2`}>
                                <IconBadge icon={LayoutDashboard} />
                                <h2 className={`text-xl ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                    {t("courseSettings")}
                                </h2>
                            </div>
                            <ImageForm
                                initialData={course}
                                courseId={course.id}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

