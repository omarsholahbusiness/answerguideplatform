"use client"

import axios from "axios";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ImageIcon, Pencil, PlusCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Course } from "@prisma/client";
import Image from "next/image";
import { FileUpload } from "@/components/file-upload";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface ImageFormProps {
    initialData: Course;
    courseId: string;
}

export const ImageForm = ({
    initialData,
    courseId
}: ImageFormProps) => {
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    const [isEditing, setIsEditing] = useState(false);

    const toggleEdit = () => setIsEditing((current) => !current);

    const router = useRouter();

    const onSubmit = async (values: { imageUrl: string }) => {
        try {
            await axios.patch(`/api/courses/${courseId}`, values);
            toast.success(t("courseUpdated"));
            toggleEdit();
            router.refresh();
        } catch {
            toast.error(t("errorOccurred"));
        }
    }

    return (
        <div className="mt-6 border bg-card rounded-md p-4" style={{ direction: isRTL ? "rtl" : "ltr" }}>
            <div className={`font-medium flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}>
                <span className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("courseImage")}</span>
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing && (<>{t("cancel")}</>)}
                    {!isEditing && !initialData.imageUrl && (
                        <>
                            <PlusCircle className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`}/>
                            {t("addImage")}
                        </>
                    )}
                    {!isEditing && initialData.imageUrl && (
                    <>
                        <Pencil className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t("editImage")}
                    </>)}
                </Button>
            </div>
            {!isEditing && (
                !initialData.imageUrl ? (
                    <div className="flex items-center justify-center h-60 bg-muted rounded-md">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                ) : (
                    <div className="relative aspect-video mt-2">
                        <Image
                            alt="Upload"
                            fill
                            className="object-cover rounded-md"
                            src={initialData.imageUrl}
                        />
                    </div>
                )
            )}

            {isEditing && (
                <div>
                    <FileUpload
                        endpoint="courseImage"
                        onChange={(res) => {
                            if (res) {
                                onSubmit({ imageUrl: res.url })
                            }
                        }}
                    />

                    <div className={`text-xs text-muted-foreground mt-4 ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                        {t("recommendedAspectRatio")}
                    </div>
                </div>
            )}
        </div>
    )
}