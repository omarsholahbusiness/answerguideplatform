"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chapter, Course, Quiz } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { CourseContentList } from "./course-content-list";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface CourseContentFormProps {
    initialData: Course & { chapters: Chapter[]; quizzes: Quiz[] };
    courseId: string;
}

export const CourseContentForm = ({
    initialData,
    courseId
}: CourseContentFormProps) => {
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [title, setTitle] = useState("");

    const router = useRouter();

    const onCreate = async () => {
        try {
            setIsUpdating(true);
            await axios.post(`/api/courses/${courseId}/chapters`, { title });
            toast.success(t("chapterCreated"));
            setTitle("");
            setIsCreating(false);
            router.refresh();
        } catch {
            toast.error(t("errorOccurred"));
        } finally {
            setIsUpdating(false);
        }
    }

    const onDelete = async (id: string, type: "chapter" | "quiz") => {
        try {
            setIsUpdating(true);
            if (type === "chapter") {
                await axios.delete(`/api/courses/${courseId}/chapters/${id}`);
                toast.success(t("chapterDeleted"));
            } else {
                await axios.delete(`/api/teacher/quizzes/${id}`);
                toast.success(t("quizDeleted"));
            }
            router.refresh();
        } catch {
            toast.error(t("errorOccurred"));
        } finally {
            setIsUpdating(false);
        }
    }

    const onReorder = async (updateData: { id: string; position: number; type: "chapter" | "quiz" }[]) => {
        try {
            setIsUpdating(true);
            await axios.put(`/api/courses/${courseId}/reorder`, {
                list: updateData
            });
            toast.success(t("contentReordered"));
            router.refresh();
        } catch {
            toast.error(t("errorOccurred"));
        } finally {
            setIsUpdating(false);
        }
    }

    const onEdit = (id: string, type: "chapter" | "quiz") => {
        if (type === "chapter") {
            router.push(`/dashboard/teacher/courses/${courseId}/chapters/${id}`);
        } else {
            router.push(`/dashboard/teacher/quizzes/${id}/edit`);
        }
    }

    // Combine chapters and quizzes for display
    const courseItems = [
        ...initialData.chapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            position: chapter.position,
            isPublished: chapter.isPublished,
            type: "chapter" as const,
            isFree: chapter.isFree
        })),
        ...initialData.quizzes.map(quiz => ({
            id: quiz.id,
            title: quiz.title,
            position: quiz.position,
            isPublished: quiz.isPublished,
            type: "quiz" as const
        }))
    ].sort((a, b) => a.position - b.position);

    return (
        <div className="relative mt-6 border bg-card rounded-md p-4" style={{ direction: isRTL ? "rtl" : "ltr" }}>
            {isUpdating && (
                <div className={`absolute h-full w-full bg-background/50 top-0 ${isRTL ? "left-0" : "right-0"} rounded-m flex items-center justify-center`}>
                    <div className="animate-spin h-6 w-6 border-4 border-primary rounded-full border-t-transparent" />
                </div>
            )}
            <div className={`font-medium flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}>
                <span className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("courseContent")}</span>
                <div className={`flex ${isRTL ? "flex-row-reverse" : ""} gap-2`}>
                    <Button onClick={() => router.push(`/dashboard/teacher/quizzes/create?courseId=${courseId}`)} variant="ghost">
                        <PlusCircle className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t("addQuiz")}
                    </Button>
                    <Button onClick={() => setIsCreating((current) => !current)} variant="ghost">
                        {isCreating ? (
                            <>{t("cancel")}</>
                        ) : (
                            <>
                                <PlusCircle className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                                {t("addChapter")}
                            </>
                        )}
                    </Button>
                </div>
            </div>
            {isCreating && (
                <div className="mt-4 space-y-4">
                    <Input
                        disabled={isUpdating}
                        placeholder={t("enterChapterTitle")}
                        dir={isRTL ? "rtl" : "ltr"}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <div className={`flex ${isRTL ? "flex-row-reverse" : ""}`}>
                        <Button
                            onClick={onCreate}
                            disabled={!title || isUpdating}
                            type="button"
                        >
                            {t("create")}
                        </Button>
                    </div>
                </div>
            )}
            {!isCreating && (
                <div className={cn(
                    `text-sm mt-2 ${isRTL ? "text-right" : "text-left"}`,
                    !courseItems.length && "text-muted-foreground italic"
                )} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                    {!courseItems.length && t("noContent")}
                    <CourseContentList
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReorder={onReorder}
                        items={courseItems}
                    />
                </div>
            )}
            {!isCreating && courseItems.length > 0 && (
                <p className={`text-xs text-muted-foreground mt-4 ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                    {t("dragDropInstruction")}
                </p>
            )}
        </div>
    );
}; 