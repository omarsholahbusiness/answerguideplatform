"use client"

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface TitleFormProps {
    initialData: {
        title: string;
    };

    courseId: string;
}

const createFormSchema = (t: (key: string) => string) => z.object({
    title: z.string().min(1, {
        message: t("titleRequired"),
    }),
});

export const TitleForm = ({
    initialData,
    courseId
}: TitleFormProps) => {
    const { t } = useTranslations();
    const { isRTL, language } = useRTL();
    const [isEditing, setIsEditing] = useState(false);

    const toggleEdit = () => setIsEditing((current) => !current);

    const router = useRouter();

    // Helper function to translate default course title
    const getDisplayTitle = (title: string): string => {
        // If title matches either Arabic or English default, translate it
        if (title === "كورس غير معرفة" || title === "Untitled Course") {
            return t("unnamedCourse");
        }
        return title;
    };

    const displayTitle = getDisplayTitle(initialData.title);

    const formSchema = createFormSchema(t);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData,
    });

    const { isSubmitting, isValid } = form.formState;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
                <span className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("courseTitle")}</span>
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing && (<>{t("cancel")}</>)}
                    {!isEditing && (
                    <>
                        <Pencil className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t("editTitle")}
                    </>)}
                </Button>
            </div>
            {!isEditing && (
                <p className={`text-sm mt-2 text-muted-foreground ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                    {displayTitle}
                </p>
            )}

            {isEditing && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField 
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input 
                                            disabled={isSubmitting}
                                            placeholder={t("enterCourseTitle")}
                                            dir={isRTL ? "rtl" : "ltr"}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} gap-x-2`}>
                            <Button disabled={!isValid || isSubmitting} type="submit">
                                {t("save")}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    )
}