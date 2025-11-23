"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditGradeDivisionDialog } from "./edit-grade-division-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface DataTableProps<TData extends { id: string }, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    hideActions?: boolean;
}

export function CoursesTable<TData extends { id: string }, TValue>({
    columns,
    data,
    hideActions = false,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [filterValue, setFilterValue] = useState("");
    const router = useRouter();
    const { t } = useTranslations();
    const { isRTL } = useRTL();

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    const handleFilterChange = (value: string) => {
        setFilterValue(value);
        table.getColumn("title")?.setFilterValue(value);
    };

    const onDelete = async (courseId: string) => {
        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(t("deleteCourseFailed"));
            }

            toast.success(t("deleteCourseSuccess"));
            router.refresh();
        } catch {
            toast.error(t("deleteCourseError"));
        }
    };

    return (
        <div>
            <div className="flex items-center py-4">
                <div className={`relative w-full max-w-sm ${isRTL ? "" : ""}`}>
                    <Search className={`absolute h-4 w-4 top-3 ${isRTL ? "right-3" : "left-3"} text-muted-foreground`} />
                    <Input
                        placeholder={t("searchCourses")}
                        value={filterValue}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className={`w-full ${isRTL ? "pr-9" : "pl-9"}`}
                    />
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="text-right">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                                {!hideActions && (
                                    <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[140px]`}>{t("actions")}</TableHead>
                                )}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className={isRTL ? "text-right" : "text-left"}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                    {!hideActions && (
                                        <TableCell className={isRTL ? "text-right" : "text-left"}>
                                            <div className={`flex items-center gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
                                                <Link href={`/dashboard/teacher/courses/${row.original.id}`}>
                                                    <Button variant="ghost" size="icon" title={t("editCourse")}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <EditGradeDivisionDialog course={row.original as any} />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" title={t("deleteCourse")}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t("deleteCourseWarning")}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => onDelete(row.original.id)}>
                                                                {t("delete")}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    {t("noResults")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className={`flex items-center ${isRTL ? "justify-end" : "justify-start"} ${isRTL ? "space-x-reverse" : "space-x-2"} space-x-2 py-4`}>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    {t("previous")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    {t("next")}
                </Button>
            </div>
        </div>
    );
} 