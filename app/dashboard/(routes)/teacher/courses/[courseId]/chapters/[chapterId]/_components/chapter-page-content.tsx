"use client";

import { ChapterForm } from "./chapter-form";
import { VideoForm } from "./video-form";
import { AttachmentsForm } from "./attachments-form";
import Link from "next/link";
import { ArrowLeft, Video, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/icon-badge";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";
import { useEffect, useState } from "react";

interface ChapterPageContentProps {
    chapter: {
        id: string;
        title: string;
        description: string | null;
        videoUrl: string | null;
        videoType: string | null;
        youtubeVideoId: string | null;
        isFree: boolean;
        isPublished: boolean;
        attachments: Array<{
            id: string;
            name: string;
            url: string;
            position: number;
            createdAt: Date;
        }>;
    };
    courseId: string;
    chapterId: string;
    completedFields: number;
    totalFields: number;
}

export const ChapterPageContent = ({
    chapter,
    courseId,
    chapterId,
    completedFields,
    totalFields
}: ChapterPageContentProps) => {
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const completionText = `(${completedFields}/${totalFields})`;

    if (!mounted) {
        return null;
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-y-2">
                    <Link href={`/dashboard/teacher/courses/${courseId}`}>
                        <Button variant="ghost" className={`mb-4 ${isRTL ? "" : "flex-row-reverse"}`}>
                            <ArrowLeft className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
                            {t("backToCourseSettings")}
                        </Button>
                    </Link>
                    <h1 className={`text-2xl font-medium ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                        {t("chapterSettings")}
                    </h1>
                    <span className={`text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                        {t("completeAllFields")} {completionText}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
                <div>
                    <ChapterForm
                        initialData={{
                            title: chapter.title,
                            description: chapter.description,
                            isFree: chapter.isFree,
                            isPublished: chapter.isPublished,
                        }}
                        courseId={courseId}
                        chapterId={chapterId}
                    />
                </div>
                <div className="space-y-6">
                    <div>
                        <div className={`flex items-center gap-x-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                            <IconBadge icon={Video} />
                            <h2 className={`text-xl ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                {t("addVideo")}
                            </h2>
                        </div>
                        <VideoForm
                            initialData={{
                                videoUrl: chapter.videoUrl,
                                videoType: chapter.videoType,
                                youtubeVideoId: chapter.youtubeVideoId,
                            }}
                            courseId={courseId}
                            chapterId={chapterId}
                        />
                    </div>
                    <div>
                        <div className={`flex items-center gap-x-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                            <IconBadge icon={Files} />
                            <h2 className={`text-xl ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                {t("chapterDocuments")}
                            </h2>
                        </div>
                        <AttachmentsForm
                            initialData={{
                                attachments: chapter.attachments,
                            }}
                            courseId={courseId}
                            chapterId={chapterId}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

