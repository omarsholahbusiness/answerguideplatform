"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob, audioName: string) => void;
    onCancel?: () => void;
    isUploading?: boolean;
}

export const AudioRecorder = ({ onRecordingComplete, onCancel, isUploading = false }: AudioRecorderProps) => {
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                setRecordedBlob(audioBlob);
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                
                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            toast.success(t("recordingStarted") || "Recording started");
        } catch (error) {
            console.error("Error starting recording:", error);
            toast.error(t("recordingError") || "Failed to start recording. Please check microphone permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            toast.success(t("recordingStopped") || "Recording stopped");
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
    };

    const playRecording = () => {
        if (audioUrl && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const handlePlayEnd = () => {
        setIsPlaying(false);
    };

    const deleteRecording = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setRecordedBlob(null);
        setRecordingTime(0);
        setIsPlaying(false);
    };

    const uploadRecording = () => {
        if (recordedBlob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const audioName = `recording-${timestamp}.${recordedBlob.type.includes('webm') ? 'webm' : 'mp4'}`;
            onRecordingComplete(recordedBlob, audioName);
            // Cleanup
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            setAudioUrl(null);
            setRecordedBlob(null);
            setRecordingTime(0);
        }
    };

    return (
        <div className={`space-y-4 p-4 border rounded-lg bg-card ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
            {!recordedBlob ? (
                <>
                    {!isRecording ? (
                        <div className="flex flex-col items-center gap-4">
                            <Button
                                onClick={startRecording}
                                className={`flex items-center gap-2 bg-[#005bd3] hover:bg-[#005bd3]/90 text-white ${isRTL ? "flex-row-reverse" : ""}`}
                                variant="default"
                            >
                                <Mic className="h-4 w-4" />
                                {t("startRecording") || "بدء التسجيل"}
                            </Button>
                            {onCancel && (
                                <Button
                                    onClick={onCancel}
                                    variant="ghost"
                                    className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                                >
                                    {t("cancel")}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-500 mb-2">
                                    {formatTime(recordingTime)}
                                </div>
                                <div className="flex items-center gap-2 justify-center">
                                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm text-muted-foreground">
                                        {isPaused ? (t("recordingPaused") || "التسجيل متوقف") : (t("recording") || "جاري التسجيل...")}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!isPaused ? (
                                    <Button
                                        onClick={pauseRecording}
                                        variant="outline"
                                        className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                                    >
                                        <Pause className="h-4 w-4" />
                                        {t("pause") || "إيقاف مؤقت"}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={resumeRecording}
                                        variant="outline"
                                        className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                                    >
                                        <Play className="h-4 w-4" />
                                        {t("resume") || "استئناف"}
                                    </Button>
                                )}
                                <Button
                                    onClick={stopRecording}
                                    variant="destructive"
                                    className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                                >
                                    <Square className="h-4 w-4" />
                                    {t("stopRecording") || "إيقاف التسجيل"}
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <audio
                        ref={audioRef}
                        src={audioUrl || undefined}
                        onEnded={handlePlayEnd}
                        className="w-full"
                    />
                    <div className="text-center">
                        <div className="text-lg font-semibold mb-2">
                            {t("recordingComplete") || "اكتمل التسجيل"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {formatTime(recordingTime)}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={playRecording}
                            variant="outline"
                            className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                        >
                            {isPlaying ? (
                                <>
                                    <Pause className="h-4 w-4" />
                                    {t("pause") || "إيقاف"}
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4" />
                                    {t("play") || "تشغيل"}
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={deleteRecording}
                            variant="outline"
                            className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                        >
                            <Trash2 className="h-4 w-4" />
                            {t("delete") || "حذف"}
                        </Button>
                        <Button
                            onClick={uploadRecording}
                            variant="default"
                            disabled={isUploading}
                            className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                        >
                            {isUploading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    {t("uploading") || "جاري الرفع..."}
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" />
                                    {t("uploadRecording") || "رفع التسجيل"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

