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
                toast.success("تم تحديث الصف الدراسي");
                toggleEdit();
                router.refresh();
            }
        } catch (error: any) {
            console.error("Error updating course grade:", error);
            const errorMessage = error?.response?.data?.error || error?.message || "حدث خطأ ما";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                الصف الدراسي
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing ? (
                        <>إلغاء</>
                    ) : (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            تعديل
                        </>
                    )}
                </Button>
            </div>
            {!isEditing && (
                <div className="mt-4 space-y-2">
                    <div className="text-sm">
                        <span className="font-medium">الصف الدراسي: </span>
                        <span className="text-muted-foreground">
                            {initialData.grade === "الكل" ? "الكل (جميع الصفوف)" : (initialData.grade || "غير محدد")}
                        </span>
                    </div>
                    {initialData.grade === "الكل" && (
                        <div className="text-sm text-blue-600">
                            ℹ️ هذا الكورس متاح لجميع الصفوف
                        </div>
                    )}
                    {!initialData.grade && (
                        <div className="text-sm text-orange-600">
                            ⚠️ يجب تحديد الصف الدراسي لعرض الكورس للطلاب
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
                                    <FormLabel>الصف الدراسي</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الصف" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="الكل">الكل (جميع الصفوف)</SelectItem>
                                            <SelectItem value="الأول الثانوي">الأول الثانوي</SelectItem>
                                            <SelectItem value="الثاني الثانوي">الثاني الثانوي</SelectItem>
                                            <SelectItem value="الثالث الثانوي">الثالث الثانوي</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {form.watch("grade") === "الكل" && (
                            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                                ℹ️ عند اختيار "الكل"، سيظهر هذا الكورس لجميع الطلاب بغض النظر عن صفوفهم.
                            </div>
                        )}

                        <div className="flex items-center gap-x-2">
                            <Button
                                disabled={isLoading}
                                type="submit"
                            >
                                حفظ
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
};
