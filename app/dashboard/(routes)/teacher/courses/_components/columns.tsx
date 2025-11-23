"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

export type Course = {
    id: string;
    title: string;
    price: number;
    isPublished: boolean;
    createdAt: Date;
    grade?: string | null;
    divisions?: string[];
}

export const useColumns = (): ColumnDef<Course>[] => {
    const { t } = useTranslations();
    const { isRTL, language } = useRTL();
    const dateLocale = language === "ar" ? ar : enUS;

    return [
        {
            accessorKey: "title",
            header: ({ column }) => {
                return (
                    <div className={isRTL ? "text-right" : "text-left"}>
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className={isRTL ? "text-right" : "text-left"}
                        >
                            {t("courseTitle")}
                            <ArrowUpDown className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        </Button>
                    </div>
                );
            },
            cell: ({ row }) => {
                return <div className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{row.getValue("title")}</div>;
            },
        },
        {
            accessorKey: "price",
            header: ({ column }) => {
                return (
                    <div className={isRTL ? "text-right" : "text-left"}>
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className={isRTL ? "text-right" : "text-left"}
                        >
                            {t("coursePrice")}
                            <ArrowUpDown className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        </Button>
                    </div>
                );
            },
            cell: ({ row }) => {
                const price = parseFloat(row.getValue("price"));
                return <div className={isRTL ? "text-right" : "text-left"} dir="ltr">{formatPrice(price)}</div>;
            },
        },
        {
            accessorKey: "isPublished",
            header: ({ column }) => {
                return (
                    <div className={isRTL ? "text-right" : "text-left"}>
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className={isRTL ? "text-right" : "text-left"}
                        >
                            {t("courseStatus")}
                            <ArrowUpDown className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        </Button>
                    </div>
                );
            },
            cell: ({ row }) => {
                const isPublished = row.getValue("isPublished") || false;
                return (
                    <div className={isRTL ? "text-right" : "text-left"}>
                        <Badge variant={isPublished ? "default" : "secondary"}>
                            {isPublished ? t("published") : t("draft")}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => {
                return (
                    <div className={isRTL ? "text-right" : "text-left"}>
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className={isRTL ? "text-right" : "text-left"}
                        >
                            {t("createdAt")}
                            <ArrowUpDown className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        </Button>
                    </div>
                );
            },
            cell: ({ row }) => {
                const date = new Date(row.getValue("createdAt"));
                return <div className={isRTL ? "text-right" : "text-left"} dir="ltr">{format(date, "dd/MM/yyyy", { locale: dateLocale })}</div>;
            },
        },
        {
            id: "grade",
            header: () => <div className={isRTL ? "text-right" : "text-left"}>{t("grade")}</div>,
            cell: ({ row }) => {
                const grade = row.original.grade;
                
                // Helper function to translate grade values
                const translateGrade = (gradeValue: string | null | undefined): string => {
                    if (!gradeValue) return t("notSpecified");
                    if (gradeValue === "الكل") return t("allGrades");
                    if (gradeValue === "الأول الثانوي") return t("firstSecondary");
                    if (gradeValue === "الثاني الثانوي") return t("secondSecondary");
                    if (gradeValue === "الثالث الثانوي") return t("thirdSecondary");
                    return gradeValue; // Fallback to original value
                };
                
                if (!grade) {
                    return (
                        <div className={isRTL ? "text-right" : "text-left"}>
                            <Badge variant="secondary" className="text-xs">
                                {t("notSpecified")}
                            </Badge>
                        </div>
                    );
                }
                
                return (
                    <div className={`text-sm ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                        <div className="font-medium">{translateGrade(grade)}</div>
                    </div>
                );
            },
        }
    ];
}; 