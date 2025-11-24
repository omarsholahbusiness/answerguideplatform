"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRTL } from "@/components/providers/rtl-provider";
import { useTranslations } from "@/lib/use-translations";
import { useState, useEffect } from "react";

type CourseWithProgress = {
  id: string;
  title: string;
  imageUrl: string | null;
  chapters: { id: string }[];
  quizzes: { id: string }[];
  progress: number;
}

type LastWatchedChapter = {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  courseImageUrl: string | null;
  position: number;
  watchedAt: Date | null;
}

type StudentStats = {
  totalCourses: number;
  totalChapters: number;
  completedChapters: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  balance: number;
}

interface DashboardContentProps {
  studentStats: StudentStats;
  lastWatchedChapter: LastWatchedChapter | null;
  coursesWithProgress: CourseWithProgress[];
}

export const DashboardContent = ({
  studentStats,
  lastWatchedChapter,
  coursesWithProgress,
}: DashboardContentProps) => {
  const { isRTL } = useRTL();
  const { t } = useTranslations();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering translated content until mounted
  if (!mounted) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">-</h1>
          <p className="text-muted-foreground">-</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("welcomeToDashboard")}</h1>
        <p className="text-muted-foreground">{t("tagline")}</p>
      </div>

      {/* Stats and Balance Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">{t("currentBalance")}</p>
              <p className="text-2xl font-bold">{studentStats.balance.toFixed(2)} {t("egp")}</p>
            </div>
          </div>
        </div>

        {/* Total Courses */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">{t("purchasedCourses")}</p>
              <p className="text-2xl font-bold">{studentStats.totalCourses}</p>
            </div>
          </div>
        </div>

        {/* Completed Chapters */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">{t("completedChapters")}</p>
              <p className="text-2xl font-bold">{studentStats.completedChapters}</p>
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">{t("averageScore")}</p>
              <p className="text-2xl font-bold">{studentStats.averageScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Watched Chapter - Big Square */}
      {lastWatchedChapter && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{t("lastWatchedChapter")}</h2>
          <div className="bg-card rounded-xl overflow-hidden border shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image Section */}
              <div className="relative h-64 lg:h-full">
                <Image
                  src={lastWatchedChapter.courseImageUrl || "/placeholder.png"}
                  alt={lastWatchedChapter.courseTitle}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 flex flex-col justify-center">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {lastWatchedChapter.courseTitle}
                  </p>
                  <h3 className="text-2xl font-bold mb-2">
                    {lastWatchedChapter.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("chapterNumber")} {lastWatchedChapter.position}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{t("lastWatched")}</span>
                  </div>
                  
                  <Button 
                    className="w-full bg-[#005bd3] hover:bg-[#005bd3]/90 text-white" 
                    size="lg"
                    asChild
                  >
                    <Link href={`/courses/${lastWatchedChapter.courseId}/chapters/${lastWatchedChapter.id}`}>
                      <Play className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {t("continueWatching")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t("learningStatistics")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("totalChapters")}</p>
                <p className="text-2xl font-bold">{studentStats.totalChapters}</p>
              </div>
            </div>
            <Progress value={(studentStats.completedChapters / Math.max(studentStats.totalChapters, 1)) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {studentStats.completedChapters} {t("ofCompleted")} {studentStats.totalChapters} {t("completedChapters")}
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("completedQuizzes")}</p>
                <p className="text-2xl font-bold">{studentStats.completedQuizzes}</p>
              </div>
            </div>
            <Progress value={(studentStats.completedQuizzes / Math.max(studentStats.totalQuizzes, 1)) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {studentStats.completedQuizzes} {t("ofCompleted")} {studentStats.totalQuizzes} {t("completedQuizzes")}
            </p>
          </div>
        </div>
      </div>

      {/* My Courses Section */}
      <div>
        <h2 className="text-xl font-semibold mb-6">{t("myCourses")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <div className="absolute top-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-gray-800">
                    {Math.round(course.progress)}%
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-3 line-clamp-2 min-h-[3rem] text-gray-900">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>
                        {course.chapters.length} {course.chapters.length === 1 ? t("chapter") : t("chapters")}
                      </span>
                    </div>
                    {course.quizzes.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                        <span>
                          {course.quizzes.length} {course.quizzes.length === 1 ? t("quiz") : t("quizzes")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">{t("progress")}</span>
                      <span className="font-bold text-[#005bd3]">{Math.round(course.progress)}%</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-[#005bd3] to-[#005bd3]/80 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-[#005bd3] hover:bg-[#005bd3]/90 text-white font-semibold py-3 text-base transition-all duration-200 hover:scale-105" 
                    variant="default"
                    asChild
                  >
                    <Link href={course.chapters.length > 0 ? `/courses/${course.id}/chapters/${course.chapters[0].id}` : `/courses/${course.id}`}>
                      {t("continueLearning")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {coursesWithProgress.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-muted/50 rounded-2xl p-8 max-w-md mx-auto">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noCoursesPurchased")}</h3>
              <p className="text-muted-foreground mb-6">{t("startLearningJourney")}</p>
              <Button asChild className="bg-[#005bd3] hover:bg-[#005bd3]/90 text-white font-semibold">
                <Link href="/dashboard/search">
                  {t("exploreAvailableCourses")}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

