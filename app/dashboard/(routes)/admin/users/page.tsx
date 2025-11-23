"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface User {
    id: string;
    fullName: string;
    phoneNumber: string;
    parentPhoneNumber: string;
    role: string;
    balance: number;
    grade?: string | null;
    division?: string | null;
    studyType?: string | null;
    governorate?: string | null;
    createdAt: string;
    updatedAt: string;
    _count: {
        courses: number;
        purchases: number;
        userProgress: number;
    };
}

interface EditUserData {
    fullName: string;
    phoneNumber: string;
    parentPhoneNumber: string;
    role: string;
}

const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editData, setEditData] = useState<EditUserData>({
        fullName: "",
        phoneNumber: "",
        parentPhoneNumber: "",
        role: ""
    });
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { t } = useTranslations();
    const { isRTL, language } = useRTL();
    const dateLocale = language === "ar" ? ar : enUS;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/admin/users");
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error(t("loadUsersError"));
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setEditData({
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            parentPhoneNumber: user.parentPhoneNumber,
            role: user.role
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;

        try {
            const response = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editData),
            });

            if (response.ok) {
                toast.success(t("updateUserSuccess"));
                setIsEditDialogOpen(false);
                setEditingUser(null);
                fetchUsers(); // Refresh the list
            } else {
                const error = await response.text();
                toast.error(error || t("updateUserError"));
            }
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error(t("updateUserError"));
        }
    };

    const handleDeleteUser = async (userId: string) => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success(t("deleteUserSuccess"));
                fetchUsers(); // Refresh the list
            } else {
                const error = await response.text();
                toast.error(error || t("deleteUserError"));
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error(t("deleteUserError"));
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
    );

    const staffUsers = filteredUsers.filter(user => user.role === "ADMIN" || user.role === "TEACHER");
    const studentUsers = filteredUsers.filter(user => user.role === "USER");

    // Helper function to translate grade values
    const translateGrade = (gradeValue: string | null | undefined): string => {
        if (!gradeValue) return t("notSpecified");
        if (gradeValue === "الكل") return t("allGrades");
        if (gradeValue === "الأول الثانوي") return t("firstSecondary");
        if (gradeValue === "الثاني الثانوي") return t("secondSecondary");
        if (gradeValue === "الثالث الثانوي") return t("thirdSecondary");
        return gradeValue; // Fallback to original value
    };

    const renderSignupDetails = (user: User) => (
        <div className={`space-y-1 text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
            <div>
                <span className="text-foreground font-medium">{t("grade")}: </span>
                {translateGrade(user.grade)}
            </div>
            <div>
                <span className="text-foreground font-medium">{t("studyType")}: </span>
                {user.studyType || t("notSpecified")}
            </div>
            <div>
                <span className="text-foreground font-medium">{t("governorate")}: </span>
                {user.governorate || t("notSpecified")}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center">{t("loading")}</div>
            </div>
        );
    }

    const getRoleText = (role: string) => {
        if (role === "TEACHER") return t("teacher");
        if (role === "ADMIN") return t("admin");
        return t("student");
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t("manageUsers")}
                </h1>
            </div>

            {/* Staff Table (Admins and Teachers) */}
            {staffUsers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t("adminStaff")}</CardTitle>
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
                                    <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("parentPhoneLabel")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"}>{t("role")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"}>{t("signupData")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("registrationDate")}</TableHead>
                                    <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[120px]`}>{t("actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staffUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                            {user.fullName}
                                        </TableCell>
                                        <TableCell dir="ltr">{user.phoneNumber}</TableCell>
                                        <TableCell dir="ltr">{user.parentPhoneNumber}</TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant="secondary"
                                                className={
                                                    user.role === "ADMIN" ? "bg-orange-600 text-white hover:bg-orange-700" : 
                                                    user.role === "TEACHER" ? "bg-blue-600 text-white hover:bg-blue-700" : 
                                                    ""
                                                }
                                            >
                                                {getRoleText(user.role)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{renderSignupDetails(user)}</TableCell>
                                        <TableCell dir="ltr">
                                            {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: dateLocale })}
                                        </TableCell>
                                        <TableCell className={isRTL ? "text-right" : "text-left"}>
                                            <div className={`flex items-center gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
                                                <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                                                    if (!open) {
                                                        setIsEditDialogOpen(false);
                                                        setEditingUser(null);
                                                    }
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditUser(user)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>تعديل المستخدم</DialogTitle>
                                                            <DialogDescription>
                                                                قم بتعديل معلومات المستخدم
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="fullName" className="text-right">
                                                                    الاسم
                                                                </Label>
                                                                <Input
                                                                    id="fullName"
                                                                    value={editData.fullName}
                                                                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="phoneNumber" className="text-right">
                                                                    رقم الهاتف
                                                                </Label>
                                                                <Input
                                                                    id="phoneNumber"
                                                                    value={editData.phoneNumber}
                                                                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="parentPhoneNumber" className="text-right">
                                                                    رقم هاتف الوالد
                                                                </Label>
                                                                <Input
                                                                    id="parentPhoneNumber"
                                                                    value={editData.parentPhoneNumber}
                                                                    onChange={(e) => setEditData({...editData, parentPhoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="role" className="text-right">
                                                                    الدور
                                                                </Label>
                                                                <Input
                                                                    id="role"
                                                                    value={editData.role === "USER" ? "طالب" : editData.role === "TEACHER" ? "معلم" : "مشرف"}
                                                                    disabled
                                                                    className="col-span-3 bg-muted"
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => {
                                                                setIsEditDialogOpen(false);
                                                                setEditingUser(null);
                                                            }}>
                                                                إلغاء
                                                            </Button>
                                                            <Button onClick={handleSaveUser}>
                                                                حفظ التغييرات
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                                
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t("deleteUserConfirm")}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t("deleteUserWarning")}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                {t("delete")}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Students Table */}
            {studentUsers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t("studentsList")}</CardTitle>
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
                                    <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("parentPhoneLabel")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"}>{t("role")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"}>{t("signupData")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("currentBalance")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"}>{t("purchasedCourses")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("registrationDate")}</TableHead>
                                    <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[120px]`}>{t("actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                            {user.fullName}
                                        </TableCell>
                                        <TableCell dir="ltr">{user.phoneNumber}</TableCell>
                                        <TableCell dir="ltr">{user.parentPhoneNumber}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {t("student")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{renderSignupDetails(user)}</TableCell>
                                        <TableCell dir="ltr">
                                            <Badge variant="secondary">
                                                {user.balance} {t("egp")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {user._count.purchases}
                                            </Badge>
                                        </TableCell>
                                        <TableCell dir="ltr">
                                            {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: dateLocale })}
                                        </TableCell>
                                        <TableCell className={isRTL ? "text-right" : "text-left"}>
                                            <div className={`flex items-center gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
                                                <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                                                    if (!open) {
                                                        setIsEditDialogOpen(false);
                                                        setEditingUser(null);
                                                    }
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditUser(user)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>تعديل المستخدم</DialogTitle>
                                                            <DialogDescription>
                                                                قم بتعديل معلومات المستخدم
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="fullName" className="text-right">
                                                                    الاسم
                                                                </Label>
                                                                <Input
                                                                    id="fullName"
                                                                    value={editData.fullName}
                                                                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="phoneNumber" className="text-right">
                                                                    رقم الهاتف
                                                                </Label>
                                                                <Input
                                                                    id="phoneNumber"
                                                                    value={editData.phoneNumber}
                                                                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="parentPhoneNumber" className="text-right">
                                                                    رقم هاتف الوالد
                                                                </Label>
                                                                <Input
                                                                    id="parentPhoneNumber"
                                                                    value={editData.parentPhoneNumber}
                                                                    onChange={(e) => setEditData({...editData, parentPhoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="role" className="text-right">
                                                                    الدور
                                                                </Label>
                                                                <Input
                                                                    id="role"
                                                                    value={editData.role === "USER" ? "طالب" : editData.role === "TEACHER" ? "معلم" : "مشرف"}
                                                                    disabled
                                                                    className="col-span-3 bg-muted"
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => {
                                                                setIsEditDialogOpen(false);
                                                                setEditingUser(null);
                                                            }}>
                                                                إلغاء
                                                            </Button>
                                                            <Button onClick={handleSaveUser}>
                                                                حفظ التغييرات
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                                
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t("deleteUserConfirm")}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t("deleteUserWarning")}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                {t("delete")}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default UsersPage; 