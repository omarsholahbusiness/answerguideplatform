"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Info } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface ActionsProps {
    disabled: boolean;
    courseId: string;
    isPublished: boolean;
}

export const Actions = ({
    disabled,
    courseId,
    isPublished,
}: ActionsProps) => {
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onClick = async () => {
        try {
            setIsLoading(true);

            if (isPublished) {
                await axios.patch(`/api/courses/${courseId}/unpublish`);
                toast.success(t("unpublishSuccess"));
            } else {
                await axios.patch(`/api/courses/${courseId}/publish`);
                toast.success(t("publishSuccess"));
            }

            router.refresh();
        } catch {
            toast.error(t("errorOccurred"));
        } finally {
            setIsLoading(false);
        }
    }

    const publishButton = (
        <Button
            onClick={onClick}
            disabled={disabled || isLoading}
            variant="outline"
            size="sm"
        >
            {isPublished ? (
                <>
                    <EyeOff className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t("unpublish")}
                </>
            ) : (
                <>
                    <Eye className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t("publishCourse")}
                </>
            )}
        </Button>
    );

    return (
        <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} gap-x-2`}>
            {disabled && !isPublished ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="relative">
                                {publishButton}
                                <Info className={`h-4 w-4 absolute -top-1 ${isRTL ? "-left-1" : "-right-1"} text-orange-500`} />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs" dir={isRTL ? "rtl" : "ltr"}>
                            <div className={`text-sm ${isRTL ? "text-right" : "text-left"}`}>
                                <p className="font-semibold mb-2" style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("cannotPublishUntil")}</p>
                                <ul className={`space-y-1 text-xs ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                    <li>• {t("addCourseTitle")}</li>
                                    <li>• {t("addCourseDescription")}</li>
                                    <li>• {t("addCourseImage")}</li>
                                    <li>• {t("setCoursePriceInfo")}</li>
                                    <li>• {t("addPublishedChapterInfo")}</li>
                                </ul>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                publishButton
            )}
        </div>
    )
} 