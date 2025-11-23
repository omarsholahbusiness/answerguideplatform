"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, User, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface User {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    _count?: {
        purchases: number;
    };
}

interface Course {
    id: string;
    title: string;
    price: number;
    isPublished: boolean;
}

const TeacherAddCoursesPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [ownedCourses, setOwnedCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"add" | "delete">("add");
    const [isAddingCourse, setIsAddingCourse] = useState(false);
    const [isDeletingCourse, setIsDeletingCourse] = useState(false);
    const [loadingOwnedCourses, setLoadingOwnedCourses] = useState(false);
    const { t } = useTranslations();
    const { isRTL } = useRTL();

    useEffect(() => {
        fetchUsers();
        fetchCourses();
    }, []);

    const fetchOwnedCourses = async (userId: string) => {
        setLoadingOwnedCourses(true);
        try {
            const res = await fetch(`/api/teacher/users/${userId}/courses`);
            console.log("[FETCH_OWNED_COURSES] Response status:", res.status, res.statusText);
            
            if (res.ok) {
                const data = await res.json();
                console.log("[FETCH_OWNED_COURSES] Success:", data);
                setOwnedCourses(data.courses || []);
            } else {
                const text = await res.text();
                console.error("[FETCH_OWNED_COURSES] Error response:", text, "Status:", res.status);
                
                let errorData;
                try {
                    errorData = JSON.parse(text);
                } catch {
                    errorData = { error: text || `HTTP ${res.status}: ${res.statusText}` };
                }
                
                console.error("Failed to fetch owned courses:", errorData);
                toast.error(errorData.error || t("errorOccurred"));
                setOwnedCourses([]);
            }
        } catch (e) {
            console.error("Error fetching owned courses", e);
            toast.error(t("errorOccurred"));
            setOwnedCourses([]);
        } finally {
            setLoadingOwnedCourses(false);
        }
    };

    useEffect(() => {
        // fetch owned courses when a user is selected
        if (selectedUser) {
            fetchOwnedCourses(selectedUser.id);
        } else {
            setOwnedCourses([]);
        }
    }, [selectedUser]);

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/teacher/users");
            if (response.ok) {
                const data = await response.json();
                // Filter only students
                const studentUsers = data.filter((user: User) => user.role === "USER");
                setUsers(studentUsers);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await fetch("/api/courses");
            if (response.ok) {
                const data = await response.json();
                // Filter only published courses
                const publishedCourses = data.filter((course: Course) => course.isPublished);
                setCourses(publishedCourses);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    const handleAddCourse = async () => {
        if (!selectedUser || !selectedCourse) {
            toast.error(t("selectStudentAndCourse"));
            return;
        }

        setIsAddingCourse(true);
        try {
            const response = await fetch(`/api/teacher/users/${selectedUser.id}/add-course`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ courseId: selectedCourse }),
            });

            if (response.ok) {
                toast.success(t("addCourseSuccess"));
                setIsDialogOpen(false);
                setSelectedUser(null);
                setSelectedCourse("");
                fetchUsers(); // Refresh the list
            } else {
                const error = await response.json();
                toast.error(error.message || t("addCourseError"));
            }
        } catch (error) {
            console.error("Error adding course:", error);
            toast.error(t("addCourseError"));
        } finally {
            setIsAddingCourse(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!selectedUser || !selectedCourse) {
            toast.error(t("selectStudentAndCourse"));
            return;
        }

        setIsDeletingCourse(true);
        try {
            const res = await fetch(`/api/teacher/users/${selectedUser.id}/add-course`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId: selectedCourse })
            });
            if (res.ok) {
                toast.success(t("deleteCourseSuccess"));
                setIsDialogOpen(false);
                setSelectedCourse("");
                setSelectedUser(null);
                fetchUsers();
            } else {
                const data = await res.json().catch(() => ({} as any));
                toast.error((data as any).error || t("deleteCourseError"));
            }
        } catch (error) {
            console.error("Error deleting course:", error);
            toast.error(t("deleteCourseError"));
        } finally {
            setIsDeletingCourse(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                    {t("addDeleteCourses")}
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("studentsList")}</CardTitle>
                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-2`}>
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("searchByNameOrPhone")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("fullName")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("phoneNumberLabel")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("role")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("purchasedCoursesCount")}</TableHead>
                                <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[200px]`}>{t("actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                        {user.fullName}
                                    </TableCell>
                                    <TableCell dir="ltr">{user.phoneNumber}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {t("student")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell dir="ltr">
                                        <Badge variant="outline">{user._count?.purchases ?? 0}</Badge>
                                    </TableCell>
                                    <TableCell className={isRTL ? "text-right" : "text-left"}>
                                        <div className={`flex items-center gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setDialogMode("add");
                                                    setSelectedCourse("");
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                                                {t("addCourse")}
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="destructive"
                                                onClick={async () => {
                                                    setSelectedUser(user);
                                                    setDialogMode("delete");
                                                    setSelectedCourse("");
                                                    setIsDialogOpen(true);
                                                    // Fetch owned courses when opening delete dialog
                                                    await fetchOwnedCourses(user.id);
                                                }}
                                            >
                                                {t("deleteCourse")}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {filteredUsers.length === 0 && !loading && (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-muted-foreground">
                            {t("noStudentsAvailable")}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Single lightweight dialog rendered once */}
            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsDialogOpen(false);
                        setSelectedCourse("");
                        setSelectedUser(null);
                        setDialogMode("add");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={isRTL ? "text-right" : "text-left"}>
                            {dialogMode === "add" ? (
                                <>{t("addCourseTo")} {selectedUser?.fullName}</>
                            ) : (
                                <>{t("deleteCourseFrom")} {selectedUser?.fullName}</>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className={`text-sm font-medium ${isRTL ? "text-right" : "text-left"}`}>{t("selectCourseLabel")}</label>
                            {dialogMode === "delete" && loadingOwnedCourses ? (
                                <div className={`text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>
                                    {t("loading")}...
                                </div>
                            ) : (
                                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("selectCoursePlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(dialogMode === "delete" ? ownedCourses : courses).length > 0 ? (
                                            (dialogMode === "delete" ? ownedCourses : courses).map((course) => (
                                                <SelectItem key={course.id} value={course.id}>
                                                    <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between w-full`}>
                                                        <span style={{ direction: isRTL ? "rtl" : "ltr" }}>{course.title}</span>
                                                        {typeof course.price === "number" && (
                                                            <Badge variant="outline" className={isRTL ? "mr-2" : "ml-2"} dir="ltr">
                                                                {course.price} {t("currency")}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className={`p-2 text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>
                                                {dialogMode === "delete" ? t("noCoursesPurchased") : t("noCoursesAvailable")}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className={`flex ${isRTL ? "justify-start" : "justify-end"} ${isRTL ? "space-x-reverse" : ""} space-x-2`}>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setSelectedCourse("");
                                    setSelectedUser(null);
                                    setDialogMode("add");
                                }}
                            >
                                {t("cancel")}
                            </Button>
                            {dialogMode === "add" ? (
                                <Button 
                                    onClick={handleAddCourse}
                                    disabled={!selectedCourse || isAddingCourse}
                                >
                                    {isAddingCourse ? t("adding") : t("addCourse")}
                                </Button>
                            ) : (
                                <Button 
                                    variant="destructive"
                                    onClick={handleDeleteCourse}
                                    disabled={!selectedCourse || isDeletingCourse}
                                >
                                    {isDeletingCourse ? t("deleting") : t("deleteCourse")}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TeacherAddCoursesPage;
