"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Volume2, Pencil, Upload, X, Play, Download, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { AudioRecorder } from "@/components/audio-recorder";
import toast from "react-hot-toast";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface ChapterAudioAttachment {
    id: string;
    name: string;
    url: string;
    position: number;
    isRecorded: boolean;
    createdAt: Date;
}

interface AudioAttachmentsFormProps {
    initialData: {
        audioAttachments: ChapterAudioAttachment[];
    };
    courseId: string;
    chapterId: string;
}

export const AudioAttachmentsForm = ({
    initialData,
    courseId,
    chapterId
}: AudioAttachmentsFormProps) => {
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    const [isEditing, setIsEditing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRecorder, setShowRecorder] = useState(false);
    const [audioAttachments, setAudioAttachments] = useState<ChapterAudioAttachment[]>(initialData.audioAttachments || []);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Helper function to extract filename from URL
    const getFilenameFromUrl = (url: string): string => {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
            
            if (filename) {
                const decodedFilename = decodeURIComponent(filename);
                const cleanFilename = decodedFilename.split('?')[0];
                return cleanFilename || t("audioAttachment") || "ملف صوتي";
            }
            return t("audioAttachment") || "ملف صوتي";
        } catch {
            return t("audioAttachment") || "ملف صوتي";
        }
    };

    const onSubmitUpload = async (url: string, name: string, isRecorded: boolean = false) => {
        try {
            setIsSubmitting(true);
            
            console.log("[AUDIO_UPLOAD] Submitting:", { url: url.substring(0, 50) + '...', name, isRecorded });
            
            const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/audio-attachments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, name, isRecorded }),
            });

            console.log("[AUDIO_UPLOAD] Response status:", response.status);
            console.log("[AUDIO_UPLOAD] Response ok:", response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[AUDIO_UPLOAD] Error response:", errorText);
                
                let errorMessage = 'Failed to upload audio attachment';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                
                throw new Error(errorMessage);
            }

            const newAttachment = await response.json();
            console.log("[AUDIO_UPLOAD] Success:", newAttachment);
            
            setAudioAttachments(prev => [...prev, newAttachment]);
            toast.success(t("courseUpdated") || "تم التحديث بنجاح");
            setShowRecorder(false);
        } catch (error) {
            console.error("[CHAPTER_AUDIO_ATTACHMENT] Full error:", error);
            const errorMessage = error instanceof Error ? error.message : (t("errorOccurred") || "حدث خطأ");
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordingComplete = async (audioBlob: Blob, audioName: string) => {
        try {
            setIsSubmitting(true);
            
            console.log("[RECORDING] Blob details:", {
                type: audioBlob.type,
                size: audioBlob.size,
                name: audioName
            });
            
            // Ensure the file has a proper MIME type and extension
            // UploadThing's audio endpoint accepts: audio/mpeg, audio/mp3, audio/wav, audio/ogg, audio/webm, audio/mp4
            // MediaRecorder typically returns 'audio/webm' or 'audio/mp4'
            let mimeType = audioBlob.type;
            let fileName = audioName;
            
            // Normalize MIME type and file extension to match UploadThing's accepted formats
            if (mimeType.includes('webm')) {
                mimeType = 'audio/webm';
                if (!fileName.endsWith('.webm')) {
                    fileName = fileName.replace(/\.(mp4|m4a|mp3|wav|ogg)$/i, '.webm') || `${fileName}.webm`;
                }
            } else if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
                mimeType = 'audio/mp4';
                if (!fileName.endsWith('.mp4') && !fileName.endsWith('.m4a')) {
                    fileName = fileName.replace(/\.(webm|mp3|wav|ogg)$/i, '.mp4') || `${fileName}.mp4`;
                }
            } else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
                mimeType = 'audio/mpeg';
                if (!fileName.endsWith('.mp3')) {
                    fileName = fileName.replace(/\.(webm|mp4|m4a|wav|ogg)$/i, '.mp3') || `${fileName}.mp3`;
                }
            } else {
                // Default to webm (commonly supported)
                mimeType = 'audio/webm';
                if (!fileName.match(/\.(webm|mp4|m4a|mp3|wav|ogg)$/i)) {
                    fileName = `${fileName}.webm`;
                }
            }
            
            // Convert blob to File with proper MIME type
            const audioFile = new File([audioBlob], fileName, { 
                type: mimeType,
                lastModified: Date.now()
            });
            
            console.log("[RECORDING] File details:", {
                name: audioFile.name,
                type: audioFile.type,
                size: audioFile.size
            });
            
            // Upload via server route
            const formData = new FormData();
            formData.append('file', audioFile);
            
            console.log("[RECORDING] Uploading to server...");
            
            const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/audio-attachments/upload`, {
                method: 'POST',
                body: formData,
            });

            console.log("[RECORDING] Response status:", response.status);
            console.log("[RECORDING] Response ok:", response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[RECORDING] Error response:", errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText || 'Failed to upload recording' };
                }
                throw new Error(errorData.error || errorData.message || `Upload failed with status ${response.status}`);
            }

            const result = await response.json();
            console.log("[RECORDING] Upload result:", result);
            
            if (!result.url) {
                throw new Error('No URL returned from upload');
            }
            
            await onSubmitUpload(result.url, result.name || fileName, true);
        } catch (error) {
            console.error("[RECORDING] Error uploading recording:", error);
            console.error("[RECORDING] Error details:", {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            const errorMessage = error instanceof Error ? error.message : (t("errorOccurred") || "حدث خطأ أثناء رفع التسجيل");
            toast.error(errorMessage);
            setIsSubmitting(false);
        }
    };

    const onDelete = async (attachmentId: string) => {
        try {
            setIsSubmitting(true);
            const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/audio-attachments/${attachmentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete audio attachment');
            }

            setAudioAttachments(prev => prev.filter(att => att.id !== attachmentId));
            toast.success(t("courseUpdated") || "تم التحديث بنجاح");
        } catch (error) {
            console.error("[CHAPTER_AUDIO_ATTACHMENT_DELETE]", error);
            toast.error(t("errorOccurred") || "حدث خطأ");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isMounted) {
        return null;
    }

    return (
        <div className="mt-6 border bg-card rounded-md p-4">
            <div className={`font-medium flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                    {t("audioAttachments") || "المرفقات الصوتية"}
                </span>
                <Button onClick={() => setIsEditing(!isEditing)} variant="ghost" className={isRTL ? "flex-row-reverse" : ""}>
                    {isEditing ? (
                        <>{t("cancel")}</>
                    ) : (
                        <>
                            <Pencil className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                            {t("manageAudioAttachments") || "إدارة المرفقات الصوتية"}
                        </>
                    )}
                </Button>
            </div>
            
            {!isEditing && (
                <div className="mt-2">
                    {audioAttachments.length > 0 ? (
                        <div className="space-y-2">
                            {audioAttachments.map((attachment) => (
                                <div key={attachment.id} className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} p-3 w-full bg-secondary/50 border-secondary/50 border text-secondary-foreground rounded-md`}>
                                    <Volume2 className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"} flex-shrink-0`} />
                                    <div className={`flex flex-col min-w-0 flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                                        <p className="text-sm font-medium truncate" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                            {attachment.name || getFilenameFromUrl(attachment.url)}
                                        </p>
                                        <p className={`text-xs text-muted-foreground ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                            {attachment.isRecorded ? (t("recordedAudio") || "تسجيل صوتي") : (t("audioFile") || "ملف صوتي")}
                                        </p>
                                    </div>
                                    <div className={`${isRTL ? "mr-auto" : "ml-auto"} flex items-center gap-2 flex-shrink-0`}>
                                        <audio controls className="h-8">
                                            <source src={attachment.url} />
                                        </audio>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => downloadAudio(attachment.url, attachment.name)}
                                            className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}
                                        >
                                            <Download className="h-3 w-3" />
                                            {t("download")}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={`text-sm mt-2 text-muted-foreground italic ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                            {t("noAudioAttachments") || "لا توجد مرفقات صوتية"}
                        </p>
                    )}
                </div>
            )}
            
            {isEditing && (
                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        {audioAttachments.map((attachment) => (
                            <div key={attachment.id} className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} p-3 w-full bg-secondary/50 border-secondary/50 border text-secondary-foreground rounded-md`}>
                                <Volume2 className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"} flex-shrink-0`} />
                                <div className={`flex flex-col min-w-0 flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                                    <p className="text-sm font-medium truncate" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                        {attachment.name || getFilenameFromUrl(attachment.url)}
                                    </p>
                                    <p className={`text-xs text-muted-foreground ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                        {attachment.isRecorded ? (t("recordedAudio") || "تسجيل صوتي") : (t("audioFile") || "ملف صوتي")}
                                    </p>
                                </div>
                                <div className={`${isRTL ? "mr-auto" : "ml-auto"} flex items-center gap-2 flex-shrink-0`}>
                                    <audio controls className="h-8">
                                        <source src={attachment.url} />
                                    </audio>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDelete(attachment.id)}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        ) : (
                                            <X className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {!showRecorder ? (
                        <div className="space-y-4">
                            <Button
                                onClick={() => setShowRecorder(true)}
                                variant="default"
                                className={`w-full flex items-center justify-center gap-2 bg-[#005bd3] hover:bg-[#005bd3]/90 text-white ${isRTL ? "flex-row-reverse" : ""}`}
                            >
                                <Mic className="h-4 w-4" />
                                {t("recordAudio") || "تسجيل صوتي"}
                            </Button>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex-1 border-t"></div>
                                <span className="text-sm text-muted-foreground">{t("or") || "أو"}</span>
                                <div className="flex-1 border-t"></div>
                            </div>
                            
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                                <FileUpload
                                    endpoint="chapterAudio"
                                    onChange={(res) => {
                                        if (res && res.url) {
                                            console.log("[FILE_UPLOAD] UploadThing response:", res);
                                            onSubmitUpload(res.url, res.name || 'ملف صوتي', false);
                                        } else {
                                            console.error("[FILE_UPLOAD] Invalid response:", res);
                                            toast.error(t("errorOccurred") || "حدث خطأ - لم يتم الحصول على رابط الملف");
                                        }
                                    }}
                                />
                                <div className={`text-xs text-muted-foreground mt-2 text-center ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                    {t("addAudioFiles") || "أضف ملفات صوتية (mp3, mov, etc.)"}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <AudioRecorder
                                onRecordingComplete={handleRecordingComplete}
                                onCancel={() => setShowRecorder(false)}
                                isUploading={isSubmitting}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    function downloadAudio(url: string, name: string) {
        try {
            const link = document.createElement('a');
            link.href = url;
            link.download = name || getFilenameFromUrl(url);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(t("courseUpdated") || "تم التحديث بنجاح");
        } catch (error) {
            console.error('Download failed:', error);
            toast.error(t("errorOccurred") || "حدث خطأ");
        }
    }
};

