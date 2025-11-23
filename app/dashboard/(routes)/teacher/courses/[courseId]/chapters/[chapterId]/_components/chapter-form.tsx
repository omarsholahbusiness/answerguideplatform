"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, Pencil, EyeOff, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Editor } from "@/components/editor";
import { Checkbox } from "@/components/ui/checkbox";
import { IconBadge } from "@/components/icon-badge";

interface ChapterFormProps {
    initialData: {
        title: string;
        description: string | null;
        isFree: boolean;
        isPublished: boolean;
    };
    courseId: string;
    chapterId: string;
}

const createTitleSchema = (t: (key: string) => string) => z.object({
    title: z.string().min(1, {
        message: t("titleRequired"),
    }),
});

const createDescriptionSchema = (t: (key: string) => string) => z.object({
    description: z.string().min(1, {
        message: t("titleRequired"),
    }),
});

const accessSchema = z.object({
    isFree: z.boolean().default(false),
});

export const ChapterForm = ({
    initialData,
    courseId,
    chapterId
}: ChapterFormProps) => {
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isEditingAccess, setIsEditingAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const titleSchema = createTitleSchema(t);
    const descriptionSchema = createDescriptionSchema(t);

    const titleForm = useForm<z.infer<typeof titleSchema>>({
        resolver: zodResolver(titleSchema),
        defaultValues: {
            title: initialData?.title || "",
        },
    });

    const descriptionForm = useForm<z.infer<typeof descriptionSchema>>({
        resolver: zodResolver(descriptionSchema),
        defaultValues: {
            description: initialData?.description || "",
        },
    });

    const accessForm = useForm<z.infer<typeof accessSchema>>({
        resolver: zodResolver(accessSchema),
        defaultValues: {
            isFree: !!initialData.isFree
        }
    });

    const { isSubmitting: isSubmittingTitle, isValid: isValidTitle } = titleForm.formState;
    const { isSubmitting: isSubmittingDescription, isValid: isValidDescription } = descriptionForm.formState;
    const { isSubmitting: isSubmittingAccess, isValid: isValidAccess } = accessForm.formState;

    const onSubmitTitle = async (values: z.infer<typeof titleSchema>) => {
        try {
            const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error('Failed to update chapter title');
            }

            toast.success(t("courseUpdated"));
            setIsEditingTitle(false);
            router.refresh();
        } catch (error) {
            console.error("[CHAPTER_TITLE]", error);
            toast.error("Something went wrong");
        }
    }

    const onSubmitDescription = async (values: z.infer<typeof descriptionSchema>) => {
        try {
            const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error('Failed to update chapter description');
            }

            toast.success(t("courseUpdated"));
            setIsEditingDescription(false);
            router.refresh();
        } catch (error) {
            console.error("[CHAPTER_DESCRIPTION]", error);
            toast.error("Something went wrong");
        }
    }

    const onSubmitAccess = async (values: z.infer<typeof accessSchema>) => {
        try {
            await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            toast.success(t("courseUpdated"));
            setIsEditingAccess(false);
            router.refresh();
        } catch (error) {
            console.error("[CHAPTER_ACCESS]", error);
            toast.error("Something went wrong");
        }
    }

    const onPublish = async () => {
        try {
            setIsLoading(true);
            
            await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/publish`);
            
            toast.success(initialData.isPublished ? t("unpublish") : t("publish"));
            router.refresh();
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }

    if (!isMounted) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-center gap-x-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <IconBadge icon={LayoutDashboard} />
                    <h2 className={`text-xl ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                        {t("chapterSettings")}
                    </h2>
                </div>
                <Button
                    onClick={onPublish}
                    disabled={isLoading}
                    variant={initialData.isPublished ? "outline" : "default"}
                    className={isRTL ? "flex-row-reverse" : ""}
                >
                    {initialData.isPublished ? (
                        <>
                            <EyeOff className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                            {t("unpublish")}
                        </>
                    ) : (
                        <>
                            <Eye className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                            {t("publish")}
                        </>
                    )}
                </Button>
            </div>
            <div className="space-y-4">
                <div className="border bg-card rounded-md p-4">
                    <div className={`font-medium flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                        <span className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("chapterTitle")}</span>
                        <Button onClick={() => setIsEditingTitle(!isEditingTitle)} variant="ghost" className={isRTL ? "flex-row-reverse" : ""}>
                            {isEditingTitle ? (
                                <>{t("cancel")}</>
                            ) : (
                                <>
                                    <Pencil className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                                    {t("editTitle")}
                                </>
                            )}
                        </Button>
                    </div>
                    {!isEditingTitle && (
                        <p className={cn(
                            `text-sm mt-2 ${isRTL ? "text-right" : "text-left"}`,
                            !initialData.title && "text-muted-foreground italic"
                        )} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                            {initialData.title || t("noTitle")}
                        </p>
                    )}
                    {isEditingTitle && (
                        <Form {...titleForm}>
                            <form
                                onSubmit={titleForm.handleSubmit(onSubmitTitle)}
                                className="space-y-4 mt-4"
                            >
                                <FormField
                                    control={titleForm.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    disabled={isSubmittingTitle}
                                                    placeholder="e.g. 'Introduction to the course'"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className={`flex items-center gap-x-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                                    <Button
                                        disabled={!isValidTitle || isSubmittingTitle}
                                        type="submit"
                                    >
                                        {t("save")}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>
                <div className="border bg-card rounded-md p-4">
                    <div className={`font-medium flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                        <span className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("chapterDescription")}</span>
                        <Button onClick={() => setIsEditingDescription(!isEditingDescription)} variant="ghost" className={isRTL ? "flex-row-reverse" : ""}>
                            {isEditingDescription ? (
                                <>{t("cancel")}</>
                            ) : (
                                <>
                                    <Pencil className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                                    {t("editDescription")}
                                </>
                            )}
                        </Button>
                    </div>
                    {!isEditingDescription && (
                        <div className={cn(
                            `text-sm mt-2 ${isRTL ? "text-right" : "text-left"}`,
                            !initialData.description && "text-muted-foreground italic"
                        )} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                            {!initialData.description && t("noDescription")}
                            {initialData.description && (
                                <div 
                                    className="prose prose-sm max-w-none space-y-4"
                                    dangerouslySetInnerHTML={{ __html: initialData.description }}
                                />
                            )}
                        </div>
                    )}
                    {isEditingDescription && (
                        <Form {...descriptionForm}>
                            <form
                                onSubmit={descriptionForm.handleSubmit(onSubmitDescription)}
                                className="space-y-4 mt-4"
                            >
                                <FormField
                                    control={descriptionForm.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Editor
                                                    onChange={field.onChange}
                                                    value={field.value}
                                                    placeholder="e.g. 'This chapter will cover the basics of...'"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className={`flex items-center gap-x-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                                    <Button
                                        disabled={!isValidDescription || isSubmittingDescription}
                                        type="submit"
                                    >
                                        {t("save")}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>
            </div>

            <div>
                <div className={`flex items-center gap-x-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <IconBadge icon={Eye} />
                    <h2 className={`text-xl ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                        {t("accessSettings")}
                    </h2>
                </div>
                <div className="space-y-4 mt-4">
                    <div className="border bg-card rounded-md p-4">
                        <div className={`font-medium flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                            <span className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("accessSettings")}</span>
                            <Button onClick={() => setIsEditingAccess(!isEditingAccess)} variant="ghost" className={isRTL ? "flex-row-reverse" : ""}>
                                {isEditingAccess ? (
                                    <>{t("cancel")}</>
                                ) : (
                                    <>
                                        <Pencil className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                                        {t("editAccess")}
                                    </>
                                )}
                            </Button>
                        </div>
                        {!isEditingAccess && (
                            <p className={cn(
                                `text-sm mt-2 ${isRTL ? "text-right" : "text-left"}`,
                                !initialData.isFree && "text-muted-foreground italic"
                            )} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                {initialData.isFree ? t("thisChapterIsFree") : t("thisChapterIsNotFree")}
                            </p>
                        )}
                        {isEditingAccess && (
                            <Form {...accessForm}>
                                <form
                                    onSubmit={accessForm.handleSubmit(onSubmitAccess)}
                                    className="space-y-4 mt-4"
                                >
                                    <FormField
                                        control={accessForm.control}
                                        name="isFree"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className={`space-y-1 leading-none ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                                    <FormDescription>
                                                        {t("checkToMakeFree")}
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    <div className={`flex items-center gap-x-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                                        <Button
                                            disabled={!isValidAccess || isSubmittingAccess}
                                            type="submit"
                                        >
                                            {t("save")}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
} 