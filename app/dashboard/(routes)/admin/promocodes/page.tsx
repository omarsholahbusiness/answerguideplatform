"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface Code {
    id: string;
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minPurchase: number | null;
    maxDiscount: number | null;
    usageLimit: number | null;
    usedCount: number;
    isActive: boolean;
    validFrom: string | null;
    validUntil: string | null;
    description: string | null;
    courseId: string | null;
    course?: {
        id: string;
        title: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}

interface Course {
    id: string;
    title: string;
    isPublished: boolean;
}

const AdminPromoCodesPage = () => {
    const [codes, setCodes] = useState<Code[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<Code | null>(null);
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    
    // Form state
    const [code, setCode] = useState("");
    const [courseId, setCourseId] = useState<string>("");

    useEffect(() => {
        fetchCodes();
        fetchCourses();
    }, []);

    const fetchCodes = async () => {
        try {
            const response = await fetch("/api/promocodes");
            if (response.ok) {
                const data = await response.json();
                setCodes(data);
            } else {
                toast.error(t("fetchCodesError"));
            }
        } catch (error) {
            console.error("Error fetching codes:", error);
            toast.error(t("fetchCodesError"));
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await fetch("/api/courses/for-promocodes");
            if (response.ok) {
                const data = await response.json();
                console.log("[ADMIN] Fetched courses data:", data);
                // Check if data is an array
                if (Array.isArray(data)) {
                    // Filter only published courses for codeItem code selection
                    const publishedCourses = data.filter((course: Course) => course.isPublished);
                    console.log("[ADMIN] Published courses:", publishedCourses);
                    setCourses(publishedCourses);
                } else {
                    console.error("[ADMIN] Courses data is not an array:", data);
                }
            } else {
                const errorText = await response.text();
                console.error("[ADMIN] Failed to fetch courses, status:", response.status, "error:", errorText);
                toast.error(`${t("fetchCoursesError")}: ${response.status}`);
            }
        } catch (error) {
            console.error("[ADMIN] Error fetching courses:", error);
            toast.error(t("fetchCoursesError"));
        }
    };

    const resetForm = () => {
        setCode("");
        setCourseId("");
        setEditingCode(null);
    };

    const openCreateDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const openEditDialog = (codeItem: Code) => {
        setCode(codeItem.code);
        setCourseId(codeItem.courseId || "");
        setEditingCode(codeItem);
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        // Validation
        if (!code.trim()) {
            toast.error(t("promocodeRequired"));
            return;
        }

        if (!courseId || courseId === "ALL") {
            toast.error(t("selectCourse"));
            return;
        }

        const data = {
            code: code.trim(),
            courseId: courseId,
            // All codeItem codes are 100% discount, single use
            discountType: "PERCENTAGE",
            discountValue: 100,
            usageLimit: 1,
            isActive: true,
        };

        try {
            const url = editingCode 
                ? `/api/promocodes/${editingCode.id}`
                : "/api/promocodes";
            const method = editingCode ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success(editingCode ? t("updatePromocodeSuccess") : t("createPromocodeSuccess"));
                setIsDialogOpen(false);
                resetForm();
                fetchCodes();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || t("errorOccurred"));
            }
        } catch (error) {
            console.error("Error saving code:", error);
            toast.error(t("savePromocodeError"));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("deletePromocodeConfirm"))) {
            return;
        }

        try {
            const response = await fetch(`/api/promocodes/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success(t("deletePromocodeSuccess"));
                fetchCodes();
            } else {
                toast.error(t("deletePromocodeError"));
            }
        } catch (error) {
            console.error("Error deleting code:", error);
            toast.error(t("deletePromocodeError"));
        }
    };

    const filteredCodes = codes.filter(codeItem =>
        codeItem.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (codeItem.description && codeItem.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center">{t("loading")}</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t("promocodes")}
                </h1>
                <Button onClick={openCreateDialog} className="bg-[#005bd3] hover:bg-[#005bd3]/90">
                    <Plus className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
                    {t("createNewPromocode")}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("promocodesList")}</CardTitle>
                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-2 mt-4`}>
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("searchByCodeOrDescription")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredCodes.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className={isRTL ? "text-right" : "text-left"}>{t("code")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"}>{t("course")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"}>{t("usage")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"}>{t("status")}</TableHead>
                                    <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[120px]`}>{t("actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCodes.map((codeItem) => (
                                    <TableRow key={codeItem.id}>
                                        <TableCell className="font-mono font-bold">
                                            <Badge variant="outline" className="gap-1">
                                                <Ticket className="h-3 w-3" />
                                                {codeItem.code}
                                            </Badge>
                                        </TableCell>
                                        <TableCell style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                            {codeItem.course?.title || t("notSpecified")}
                                        </TableCell>
                                        <TableCell>
                                            {codeItem.usedCount > 0 ? (
                                                <Badge variant="destructive">{t("used")}</Badge>
                                            ) : (
                                                <Badge variant="default">{t("available")}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={codeItem.isActive ? "default" : "secondary"}>
                                                {codeItem.isActive ? t("active") : t("inactive")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={isRTL ? "text-right" : "text-left"}>
                                            <div className={`flex gap-2 ${isRTL ? "justify-end" : "justify-start"} items-center`}>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openEditDialog(codeItem)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(codeItem.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            {searchTerm ? t("noResults") : t("noPromocodes")}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCode ? t("editPromocode") : t("createPromocode")}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCode ? t("editPromocodeDescription") : t("createPromocodeDescription")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">{t("promocodeName")} *</Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder={t("promocodeCodePlaceholder")}
                                disabled={!!editingCode}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t("promocodeCodeHint")}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="courseId">{t("course")} *</Label>
                            <Select value={courseId || ""} onValueChange={setCourseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("selectCourseLabel")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {t("promocodeCourseHint")}
                            </p>
                        </div>

                        <div className={`flex ${isRTL ? "justify-end" : "justify-start"} ${isRTL ? "space-x-reverse" : ""} gap-2 pt-4`}>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                {t("cancel")}
                            </Button>
                            <Button onClick={handleSubmit} className="bg-[#005bd3] hover:bg-[#005bd3]/90">
                                {editingCode ? t("update") : t("create")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPromoCodesPage;
