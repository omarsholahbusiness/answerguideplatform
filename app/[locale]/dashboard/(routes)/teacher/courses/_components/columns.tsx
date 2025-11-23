"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export type Course = {
    id: string;
    title: string;
    price: number;
    isPublished: boolean;
    createdAt: Date;
    grade?: string | null;
    divisions?: string[];
}

export const columns: ColumnDef<Course>[] = [
    {
        accessorKey: "title",
        header: ({ column }) => {
            return (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-right"
                    >
                        العنوان
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            );
        },
        cell: ({ row }) => {
            return <div className="text-right font-medium">{row.getValue("title")}</div>;
        },
    },
    {
        accessorKey: "price",
        header: ({ column }) => {
            return (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-right"
                    >
                        السعر
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            );
        },
        cell: ({ row }) => {
            const price = parseFloat(row.getValue("price"));
            return <div className="text-right">{formatPrice(price)}</div>;
        },
    },
    {
        accessorKey: "isPublished",
        header: ({ column }) => {
            return (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-right"
                    >
                        الحالة
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            );
        },
        cell: ({ row }) => {
            const isPublished = row.getValue("isPublished") || false;
            return (
                <div className="text-right">
                    <Badge variant={isPublished ? "default" : "secondary"}>
                        {isPublished ? "منشور" : "مسودة"}
                    </Badge>
                </div>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-right"
                    >
                        انشئ في
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            );
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue("createdAt"));
            return <div className="text-right">{format(date, "dd/MM/yyyy", { locale: ar })}</div>;
        },
    },
    {
        id: "grade",
        header: () => <div className="text-right">الصف الدراسي</div>,
        cell: ({ row }) => {
            const grade = row.original.grade;
            
            if (!grade) {
                return (
                    <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                            ⚠️ غير محدد
                        </Badge>
                    </div>
                );
            }
            
            if (grade === "الكل") {
                return (
                    <div className="text-sm text-right">
                        <div className="font-medium">الكل (جميع الصفوف)</div>
                    </div>
                );
            }
            
            return (
                <div className="text-sm text-right">
                    <div className="font-medium">{grade}</div>
                </div>
            );
        },
    }
]; 