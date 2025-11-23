"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditGradeDivisionDialog } from "@/app/dashboard/(routes)/teacher/courses/_components/edit-grade-division-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";
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

type Course = {
  id: string;
  title: string;
  price: number;
  isPublished: boolean;
  createdAt: string | Date;
  grade?: string | null;
  division?: string | null;
};

export function AdminCoursesTable({ courses, onDeleted }: { courses: Course[]; onDeleted?: () => void }) {
  const router = useRouter();
  const [filterValue, setFilterValue] = useState("");
  const { t } = useTranslations();
  const { isRTL, language } = useRTL();
  const dateLocale = language === "ar" ? ar : enUS;
  
  // Filter courses based on search
  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(filterValue.toLowerCase())
  );

  const handleDelete = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || t("deleteCourseFailed"));
      }
      toast.success(t("deleteCourseSuccess"));
      router.refresh();
      onDeleted?.();
    } catch (e: any) {
      toast.error(e?.message || t("deleteCourseError"));
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
            onChange={(e) => setFilterValue(e.target.value)}
            className={`w-full ${isRTL ? "pr-9" : "pl-9"}`}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={isRTL ? "text-right" : "text-left"}>{t("courseTitle")}</TableHead>
              <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("coursePrice")}</TableHead>
              <TableHead className={isRTL ? "text-right" : "text-left"}>{t("courseStatus")}</TableHead>
              <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("createdAt")}</TableHead>
              <TableHead className={isRTL ? "text-right" : "text-left"}>{t("grade")}</TableHead>
              <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[140px]`}>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium" style={{ direction: isRTL ? "rtl" : "ltr" }}>{course.title}</TableCell>
                  <TableCell dir="ltr">{formatPrice(course.price || 0)}</TableCell>
                  <TableCell>
                    <Badge variant={course.isPublished ? "default" : "secondary"}>
                      {course.isPublished ? t("published") : t("draft")}
                    </Badge>
                  </TableCell>
                  <TableCell dir="ltr">
                    <div className="text-sm">
                      {format(new Date(course.createdAt), "dd/MM/yyyy", { locale: dateLocale })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {course.grade ? (
                      course.grade === "الكل" ? (
                        <div className={`text-sm ${isRTL ? "text-right" : "text-left"}`}>
                          <div className="font-medium">{t("allGrades")}</div>
                        </div>
                      ) : (
                        <div className={`text-sm ${isRTL ? "text-right" : "text-left"}`}>
                          <div className="font-medium">{course.grade}</div>
                        </div>
                      )
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {t("notSpecified")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={isRTL ? "text-right" : "text-left"}>
                    <div className={`flex items-center gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
                      <Link href={`/dashboard/teacher/courses/${course.id}`}>
                        <Button variant="ghost" size="icon" title={t("editCourse")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <EditGradeDivisionDialog course={course as any} />
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
                            <AlertDialogAction onClick={() => handleDelete(course.id)}>
                              {t("delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center"
                >
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


