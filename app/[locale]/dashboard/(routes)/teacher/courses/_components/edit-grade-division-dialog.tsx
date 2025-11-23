"use client";

import { useState, useEffect } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { GraduationCap } from "lucide-react";

const formSchema = z.object({
    grade: z.string().optional(),
});

interface EditGradeDivisionDialogProps {
    course: Course & { divisions?: string[] };
}

export const EditGradeDivisionDialog = ({ course }: EditGradeDivisionDialogProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            grade: course.grade || "",
        },
    });

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (open) {
            form.reset({
                grade: course.grade || "",
            });
        }
    }, [open, course, form]);

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
            
            const response = await axios.patch(`/api/courses/${course.id}`, updateData);
            
            if (response.status === 200) {
                toast.success("تم تحديث الصف الدراسي");
                setOpen(false);
                router.refresh();
            }
        } catch (error: any) {
            console.error("Error updating course grade:", error);
            let errorMessage = "حدث خطأ ما";
            
            if (error?.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="تعديل الصف الدراسي">
                    <GraduationCap className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تعديل الصف الدراسي</DialogTitle>
                    <DialogDescription>
                        حدد الصف الدراسي لهذا الكورس لعرضه للطلاب المناسبين. يمكنك اختيار "الكل" لعرض الكورس لجميع الصفوف.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                        {/* Show info message when "الكل" is selected */}
                        {form.watch("grade") === "الكل" && (
                            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                                ℹ️ عند اختيار "الكل"، سيظهر هذا الكورس لجميع الطلاب بغض النظر عن صفوفهم.
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
                                حفظ
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
