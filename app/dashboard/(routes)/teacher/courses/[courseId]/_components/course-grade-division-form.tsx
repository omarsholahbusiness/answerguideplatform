"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Course } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

const formSchema = z.object({
    grade: z.string().optional(),
});

interface CourseGradeDivisionFormProps {
    initialData: Course & { divisions?: string[] };
    courseId: string;
}

export const CourseGradeDivisionForm = ({
    initialData,
    courseId
}: CourseGradeDivisionFormProps) => {
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            grade: initialData.grade || "",
        },
    });

    const toggleEdit = () => {
        if (isEditing) {
            form.reset({
                grade: initialData.grade || "",
            });
        }
        setIsEditing((current) => !current);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsLoading(true);
            
            // Prepare data - only grade, no divisions
            const updateData: { grade?: string | null; divisions?: string[] } = {};
            
            if (values.grade && values.grade.trim() !== "") {
                updateData.grade = values.grade.trim();
                updateData.divisions = []; // Always set divisions to empty array
            } else {
                updateData.grade = null;
                updateData.divisions = [];
            }
            
            const response = await axios.patch(`/api/courses/${courseId}`, updateData);
            
            if (response.status === 200) {
                toast.success(t("gradeUpdated"));
                toggleEdit();
                router.refresh();
            }
        } catch (error: any) {
            console.error("Error updating course grade:", error);
            const errorMessage = error?.response?.data?.error || error?.message || t("errorOccurred");
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4">
            <div className={`font-medium flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}>
                <span className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("courseGrade")}</span>
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing ? (
                        <>{t("cancel")}</>
                    ) : (
                        <>
                            <Pencil className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                            {t("edit")}
                        </>
                    )}
                </Button>
            </div>
            {!isEditing && (
                <div className={`mt-4 space-y-2 ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                    <div className="text-sm">
                        <span className="font-medium">{t("courseGradeField")}: </span>
                        <span className="text-muted-foreground">
                            {(() => {
                                // Helper function to translate grade values
                                if (!initialData.grade) return t("notSpecified");
                                if (initialData.grade === "الكل") return t("allGrades");
                                if (initialData.grade === "الأول الثانوي") return t("firstSecondary");
                                if (initialData.grade === "الثاني الثانوي") return t("secondSecondary");
                                if (initialData.grade === "الثالث الثانوي") return t("thirdSecondary");
                                return initialData.grade; // Fallback to original value
                            })()}
                        </span>
                    </div>
                    {initialData.grade === "الكل" && (
                        <div className="text-sm text-blue-600">
                            ℹ️ {t("courseAvailableAllGrades")}
                        </div>
                    )}
                    {!initialData.grade && (
                        <div className="text-sm text-orange-600">
                            ⚠️ {t("mustSetGrade")}
                        </div>
                    )}
                </div>
            )}
            {isEditing && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="grade"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("courseGradeField")}</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger dir={isRTL ? "rtl" : "ltr"}>
                                                <SelectValue placeholder={t("selectGrade")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                                            <SelectItem value="الكل">{t("allGrades")}</SelectItem>
                                            <SelectItem value="الأول الثانوي">{t("firstSecondary")}</SelectItem>
                                            <SelectItem value="الثاني الثانوي">{t("secondSecondary")}</SelectItem>
                                            <SelectItem value="الثالث الثانوي">{t("thirdSecondary")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {form.watch("grade") === "الكل" && (
                            <div className={`text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200 ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                ℹ️ {t("allGradesInfo")}
                            </div>
                        )}

                        <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} gap-x-2`}>
                            <Button
                                disabled={isLoading}
                                type="submit"
                            >
                                {t("save")}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
};
