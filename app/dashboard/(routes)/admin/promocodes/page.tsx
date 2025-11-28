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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Edit, Trash2, Search, Ticket, Trash, ChevronUp, ChevronDown, Copy } from "lucide-react";
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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteCourseId, setDeleteCourseId] = useState<string>("");
    const [isDeleting, setIsDeleting] = useState(false);
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    
    // Form state
    const [code, setCode] = useState("");
    const [courseId, setCourseId] = useState<string>("");
    const [quantity, setQuantity] = useState<number>(1);
    const [quantityInput, setQuantityInput] = useState<string>("1");
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedCourseForCopy, setSelectedCourseForCopy] = useState<string>("all");
    const [isCopyPopoverOpen, setIsCopyPopoverOpen] = useState(false);

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
        setQuantity(1);
        setQuantityInput("1");
        setEditingCode(null);
        setSelectedCourseForCopy("all");
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
        if (!courseId || courseId === "ALL") {
            toast.error(t("selectCourse"));
            return;
        }

        // For editing, use the existing single code logic
        if (editingCode) {
            if (!code.trim()) {
                toast.error(t("promocodeRequired"));
                return;
            }

            const data = {
                code: code.trim(),
                courseId: courseId,
                discountType: "PERCENTAGE",
                discountValue: 100,
                usageLimit: 1,
                isActive: true,
            };

            try {
                const response = await fetch(`/api/promocodes/${editingCode.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    toast.success(t("updatePromocodeSuccess"));
                    setIsDialogOpen(false);
                    resetForm();
                    fetchCodes();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.error || t("errorOccurred"));
                }
            } catch (error) {
                console.error("Error updating code:", error);
                toast.error(t("savePromocodeError"));
            }
            return;
        }

        // For creating new codes - bulk generation
        if (quantity < 1 || quantity > 99) {
            toast.error(t("quantityValidationError"));
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch("/api/promocodes/bulk", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    courseId: courseId,
                    quantity: quantity,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(t("codesCreatedSuccess").replace("{count}", result.count.toString()));
                setIsDialogOpen(false);
                resetForm();
                fetchCodes();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || t("errorOccurred"));
            }
        } catch (error) {
            console.error("Error generating codes:", error);
            toast.error(t("savePromocodeError"));
        } finally {
            setIsGenerating(false);
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

    const handleBulkDelete = async () => {
        if (!deleteCourseId) {
            toast.error(t("selectCourseToDelete"));
            return;
        }

        const confirmMessage = deleteCourseId === "ALL" 
            ? t("deleteAllCodesConfirm")
            : t("deleteCourseCodesConfirm");

        if (!confirm(confirmMessage)) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch("/api/promocodes/bulk-delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ courseId: deleteCourseId }),
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(t("codesDeletedSuccess").replace("{count}", result.count.toString()));
                setIsDeleteDialogOpen(false);
                setDeleteCourseId("");
                fetchCodes();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || t("errorOccurred"));
            }
        } catch (error) {
            console.error("Error deleting codes:", error);
            toast.error(t("deletePromocodeError"));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopyAllCodes = async () => {
        // Filter codes based on selected course
        let filteredCodes = codes.filter(codeItem => codeItem.isActive && codeItem.usedCount === 0);
        
        if (selectedCourseForCopy !== "all") {
            filteredCodes = filteredCodes.filter(codeItem => codeItem.courseId === selectedCourseForCopy);
        }
        
        const availableCodes = filteredCodes.map(codeItem => codeItem.code);
        
        if (availableCodes.length === 0) {
            toast.error(t("noCodesAvailableToCopy"));
            return;
        }

        // Join codes with newline
        const codesText = availableCodes.join("\n");
        
        try {
            await navigator.clipboard.writeText(codesText);
            const courseName = selectedCourseForCopy === "all" 
                ? t("allCourses")
                : courses.find(c => c.id === selectedCourseForCopy)?.title || t("selectedCourse");
            toast.success(t("copyCodesSuccess").replace("{count}", availableCodes.length.toString()).replace("{course}", courseName));
            setIsCopyPopoverOpen(false);
        } catch (error) {
            console.error("Error copying to clipboard:", error);
            toast.error(t("copyCodesError"));
        }
    };

    const filteredCodes = codes.filter(codeItem =>
        codeItem.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (codeItem.description && codeItem.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Get unique courses that have codes
    const coursesWithCodes = Array.from(
        new Map(
            codes
                .filter(c => c.courseId && c.course)
                .map(c => [c.courseId, c.course])
        ).values()
    ) as Array<{ id: string; title: string }>;

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
                    <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}>
                        <CardTitle>{t("promocodesList")}</CardTitle>
                        <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                            <Popover open={isCopyPopoverOpen} onOpenChange={setIsCopyPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                    >
                                        <Copy className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
                                        {t("copyAvailableCodes")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align={isRTL ? "end" : "start"}>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>{t("selectCourseToCopy")}</Label>
                                            <Select value={selectedCourseForCopy} onValueChange={setSelectedCourseForCopy}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("selectCourseToCopy")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t("allCourses")}</SelectItem>
                                                    {coursesWithCodes.map((course) => (
                                                        <SelectItem key={course.id} value={course.id}>
                                                            {course.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button 
                                            className="w-full bg-[#005bd3] hover:bg-[#005bd3]/90"
                                            onClick={handleCopyAllCodes}
                                        >
                                            <Copy className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
                                            {t("copy")}
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
                                {t("deleteCodes")}
                            </Button>
                        </div>
                    </div>
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
                        {editingCode && (
                            <div className="space-y-2">
                                <Label htmlFor="code">{t("code")}</Label>
                                <Input
                                    id="code"
                                    value={code}
                                    readOnly
                                    className="bg-muted font-mono font-bold text-center"
                                    placeholder={t("promocodeCodePlaceholder")}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t("promocodeCodeHint")}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="courseId">{t("course")} *</Label>
                            <Select value={courseId || ""} onValueChange={setCourseId} disabled={isGenerating}>
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

                        {!editingCode && (
                            <div className="space-y-2">
                                <Label htmlFor="quantity">{t("quantityLabel")} *</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        max="99"
                                        value={quantityInput}
                                        onChange={(e) => {
                                            const inputValue = e.target.value;
                                            setQuantityInput(inputValue);
                                            if (inputValue === "") {
                                                // Allow empty string for deletion
                                                return;
                                            }
                                            const numValue = parseInt(inputValue);
                                            if (!isNaN(numValue) && numValue >= 1 && numValue <= 99) {
                                                setQuantity(numValue);
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const inputValue = e.target.value;
                                            if (inputValue === "" || parseInt(inputValue) < 1 || isNaN(parseInt(inputValue))) {
                                                setQuantityInput("1");
                                                setQuantity(1);
                                            } else {
                                                const numValue = parseInt(inputValue);
                                                if (numValue >= 1 && numValue <= 99) {
                                                    setQuantityInput(numValue.toString());
                                                    setQuantity(numValue);
                                                }
                                            }
                                        }}
                                        disabled={isGenerating}
                                        className="flex-1"
                                    />
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => {
                                                const currentValue = parseInt(quantityInput) || 1;
                                                const newValue = Math.min(99, currentValue + 1);
                                                setQuantityInput(newValue.toString());
                                                setQuantity(newValue);
                                            }}
                                            disabled={isGenerating || quantity >= 99}
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => {
                                                const currentValue = parseInt(quantityInput) || 1;
                                                const newValue = Math.max(1, currentValue - 1);
                                                setQuantityInput(newValue.toString());
                                                setQuantity(newValue);
                                            }}
                                            disabled={isGenerating || quantity <= 1}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t("quantityHint")}
                                </p>
                            </div>
                        )}

                        <div className={`flex ${isRTL ? "justify-end" : "justify-start"} ${isRTL ? "space-x-reverse" : ""} gap-2 pt-4`}>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isGenerating}>
                                {t("cancel")}
                            </Button>
                            <Button 
                                onClick={handleSubmit} 
                                className="bg-[#005bd3] hover:bg-[#005bd3]/90"
                                disabled={isGenerating}
                            >
                                {isGenerating 
                                    ? t("generatingCodes")
                                    : editingCode 
                                        ? t("update") 
                                        : t("createCodesButton")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("deleteCodesTitle")}</DialogTitle>
                        <DialogDescription>
                            {t("deleteCodesDescription")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="deleteCourseId">{t("course")} *</Label>
                            <Select 
                                value={deleteCourseId || ""} 
                                onValueChange={setDeleteCourseId}
                                disabled={isDeleting}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t("selectCourseToDeletePlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">{t("allDeleteOption")}</SelectItem>
                                    {coursesWithCodes.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className={`flex ${isRTL ? "justify-end" : "justify-start"} ${isRTL ? "space-x-reverse" : ""} gap-2 pt-4`}>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setIsDeleteDialogOpen(false);
                                    setDeleteCourseId("");
                                }}
                                disabled={isDeleting}
                            >
                                {t("cancel")}
                            </Button>
                            <Button 
                                onClick={handleBulkDelete} 
                                variant="destructive"
                                disabled={isDeleting || !deleteCourseId}
                            >
                                {isDeleting ? t("deleting") : t("deleteButton")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPromoCodesPage;
