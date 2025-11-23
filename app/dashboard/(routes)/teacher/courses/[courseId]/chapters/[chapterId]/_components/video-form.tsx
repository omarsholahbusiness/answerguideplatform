"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Video, Pencil, Upload, Youtube, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { PlyrVideoPlayer } from "@/components/plyr-video-player";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface VideoFormProps {
    initialData: {
        videoUrl: string | null;
        videoType: string | null;
        youtubeVideoId: string | null;
    };
    courseId: string;
    chapterId: string;
}

export const VideoForm = ({
    initialData,
    courseId,
    chapterId
}: VideoFormProps) => {
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    const [isEditing, setIsEditing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const onSubmitUpload = async (url: string) => {
        try {
            setIsSubmitting(true);
            const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error('Failed to upload video');
            }

            toast.success(t("courseUpdated"));
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error("[CHAPTER_VIDEO]", error);
            toast.error(t("errorOccurred"));
        } finally {
            setIsSubmitting(false);
        }
    }

    const onSubmitYouTube = async () => {
        if (!youtubeUrl.trim()) {
            toast.error(t("titleRequired"));
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/youtube`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ youtubeUrl }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Failed to add YouTube video');
            }

            toast.success(t("courseUpdated"));
            setIsEditing(false);
            setYoutubeUrl("");
            router.refresh();
        } catch (error) {
            console.error("[CHAPTER_YOUTUBE]", error);
            toast.error(error instanceof Error ? error.message : t("errorOccurred"));
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isMounted) {
        return null;
    }

    return (
        <div className="mt-6 border bg-card rounded-md p-4">
            <div className={`font-medium flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("chapterVideo")}</span>
                <Button onClick={() => setIsEditing(!isEditing)} variant="ghost" className={isRTL ? "flex-row-reverse" : ""}>
                    {isEditing ? (
                        <>{t("cancel")}</>
                    ) : (
                        <>
                            <Pencil className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                            {t("editVideo")}
                        </>
                    )}
                </Button>
            </div>
            
            {!isEditing && (
                <div className="relative aspect-video mt-2">
                    {initialData.videoUrl ? (
                        (() => {
                            console.log("🔍 VideoForm rendering PlyrVideoPlayer with:", {
                                videoUrl: initialData.videoUrl,
                                videoType: initialData.videoType,
                                youtubeVideoId: initialData.youtubeVideoId,
                                isUpload: initialData.videoType === "UPLOAD",
                                isYouTube: initialData.videoType === "YOUTUBE"
                            });
                            return (
                                <PlyrVideoPlayer
                                    videoUrl={initialData.videoType === "UPLOAD" ? initialData.videoUrl : undefined}
                                    youtubeVideoId={initialData.videoType === "YOUTUBE" ? initialData.youtubeVideoId || undefined : undefined}
                                    videoType={(initialData.videoType as "UPLOAD" | "YOUTUBE") || "UPLOAD"}
                                    className="w-full h-full"
                                />
                            );
                        })()
                    ) : (
                        <div className="flex items-center justify-center h-full bg-muted rounded-md">
                            <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                    )}
                </div>
            )}
            
            {isEditing && (
                <div className="mt-4">
                    <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload" className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                                <Upload className="h-4 w-4" />
                                {t("uploadVideo")}
                            </TabsTrigger>
                            <TabsTrigger value="youtube" className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                                <Youtube className="h-4 w-4" />
                                {t("youtubeLink")}
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="upload" className="mt-4">
                            <div className="space-y-4">
                                <div className={`text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                    {t("uploadVideoFromDevice")}
                                </div>
                                <FileUpload
                                    endpoint="chapterVideo"
                                    onChange={(res) => {
                                        if (res?.url) {
                                            onSubmitUpload(res.url);
                                        }
                                    }}
                                />
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="youtube" className="mt-4">
                            <div className="space-y-4">
                                <div className={`text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                    {t("pasteYoutubeLink")}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="youtube-url" className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("youtubeUrlLabel")}</Label>
                                    <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                                        <Input
                                            id="youtube-url"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            value={youtubeUrl}
                                            onChange={(e) => setYoutubeUrl(e.target.value)}
                                            className="flex-1"
                                            dir="ltr"
                                        />
                                        <Button 
                                            onClick={onSubmitYouTube}
                                            disabled={isSubmitting || !youtubeUrl.trim()}
                                            className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                                        >
                                            <Link className="h-4 w-4" />
                                            {t("add")}
                                        </Button>
                                    </div>
                                </div>
                                <div className={`text-xs text-muted-foreground ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                    {t("supportsLinks")}:
                                    <br />
                                    • https://www.youtube.com/watch?v=VIDEO_ID
                                    <br />
                                    • https://youtu.be/VIDEO_ID
                                    <br />
                                    • https://www.youtube.com/embed/VIDEO_ID
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    )
} 