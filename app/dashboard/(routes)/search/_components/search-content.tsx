"use client";

import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRTL } from "@/components/providers/rtl-provider";
import { useTranslations } from "@/lib/use-translations";

type CourseWithDetails = {
    id: string;
    title: string;
    imageUrl: string | null;
    price: number | null;
    chapters: { id: string }[];
    purchases: { id: string }[];
    _count: {
        purchases: number;
    };
    progress: number;
    updatedAt: Date;
}

interface SearchContentProps {
    title: string | null;
    coursesWithProgress: CourseWithDetails[];
    userGrade: string | null;
    userRole: string | null;
}

export const SearchContent = ({
    title,
    coursesWithProgress,
    userGrade,
    userRole,
}: SearchContentProps) => {
    const { isRTL, language } = useRTL();
    const { t } = useTranslations();

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(language === "ar" ? "ar" : "en-US", {
            year: 'numeric',
            month: 'short'
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{t("searchCourses")}</h1>
                <p className="text-muted-foreground text-lg">
                    {title 
                        ? `${t("searchResultsFor")} "${title}"`
                        : t("searchCoursesDescription")
                    }
                </p>
            </div>

            {/* Results Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                        {title 
                            ? `${t("searchResults")} (${coursesWithProgress.length})` 
                            : `${t("allCourses")} (${coursesWithProgress.length})`
                        }
                    </h2>
                    {coursesWithProgress.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                            {coursesWithProgress.length} {coursesWithProgress.length === 1 ? t("course") : t("courses")} {t("available")}
                        </div>
                    )}
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {coursesWithProgress.map((course) => (
                        <div
                            key={course.id}
                            className="group bg-card rounded-2xl overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                        >
                            <div className="relative w-full aspect-[16/9]">
                                <Image
                                    src={course.imageUrl || "/placeholder.png"}
                                    alt={course.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                {/* Course Status Badge */}
                                <div className={`absolute top-4 ${isRTL ? "right-4" : "left-4"}`}>
                                    <div className={`rounded-full px-3 py-1 text-sm font-medium ${
                                        course.purchases.length > 0 
                                            ? "bg-green-500 text-white" 
                                            : "bg-white/90 backdrop-blur-sm text-gray-800"
                                    }`}>
                                        {course.purchases.length > 0 ? t("enrolled") : t("available")}
                                    </div>
                                </div>

                                {/* Price Badge */}
                                <div className={`absolute top-4 ${isRTL ? "left-4" : "right-4"}`}>
                                    <div className={`rounded-full px-3 py-1 text-sm font-medium ${
                                        course.price === 0 
                                            ? "bg-green-500 text-white" 
                                            : "bg-white/90 backdrop-blur-sm text-gray-800"
                                    }`}>
                                        {course.price === 0 ? t("free") : `${course.price} ${t("egp")}`}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold mb-3 line-clamp-2 min-h-[3rem] text-gray-900">
                                        {course.title}
                                    </h3>
                                    
                                    {/* Course Stats */}
                                    <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-1">
                                            <BookOpen className="h-4 w-4" />
                                            <span className="whitespace-nowrap">
                                                {course.chapters.length} {course.chapters.length === 1 ? t("chapter") : t("chapters")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span className="whitespace-nowrap">{formatDate(course.updatedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <Button 
                                    className="w-full bg-[#005bd3] hover:bg-[#005bd3]/90 text-white font-semibold py-3 text-base transition-all duration-200 hover:scale-105" 
                                    variant="default"
                                    asChild
                                >
                                    <Link href={course.chapters.length > 0 ? `/courses/${course.id}/chapters/${course.chapters[0].id}` : `/courses/${course.id}`}>
                                        {course.purchases.length > 0 ? t("continueLearning") : t("viewCourse")}
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {coursesWithProgress.length === 0 && (
                    <div className="text-center py-16">
                        <div className="bg-muted/50 rounded-2xl p-8 max-w-md mx-auto">
                            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {title ? t("noCoursesFound") : t("noCoursesAvailable")}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {title 
                                    ? t("tryDifferentSearch")
                                    : userRole === "USER" && userGrade
                                        ? `${t("noCoursesFoundForGrade")} "${userGrade}" ${language === "ar" ? "حالياً" : "at the moment"}`
                                        : t("coursesComingSoon")
                                }
                            </p>
                            {title && (
                                <Button asChild className="bg-[#005bd3] hover:bg-[#005bd3]/90 text-white font-semibold">
                                    <Link href="/dashboard/search">
                                        {t("viewAllCourses")}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

