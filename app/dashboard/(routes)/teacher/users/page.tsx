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
            const response = await fetch("/api/teacher/users");
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                console.error("Error fetching users:", response.status, response.statusText);
                if (response.status === 403) {
                    toast.error(t("accessDenied") || "ليس لديك صلاحية للوصول إلى هذه الصفحة");
                } else {
                    toast.error(t("loadUsersError"));
                }
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
            const response = await fetch(`/api/teacher/users/${editingUser.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editData),
            });

            if (response.ok) {
                const userType = editingUser.role === "TEACHER" ? t("teacher") : editingUser.role === "ADMIN" ? t("admin") : t("student");
                toast.success(`${t("updateUserSuccess")} - ${userType}`);
                setIsEditDialogOpen(false);
                setEditingUser(null);
                fetchUsers(); // Refresh the list
            } else {
                const error = await response.text();
                console.error("Error updating user:", response.status, error);
                if (response.status === 403) {
                    toast.error(t("accessDenied") || "ليس لديك صلاحية لتعديل البيانات");
                } else if (response.status === 404) {
                    toast.error(t("userNotFound") || "المستخدم غير موجود");
                } else if (response.status === 400) {
                    toast.error(error || t("invalidData") || "بيانات غير صحيحة");
                } else {
                    toast.error(t("updateUserError"));
                }
            }
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error(t("updateUserError"));
        }
    };

    const handleDeleteUser = async (userId: string) => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/teacher/users/${userId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success(t("deleteUserSuccess"));
                fetchUsers(); // Refresh the list
            } else {
                const error = await response.text();
                console.error("Error deleting user:", response.status, error);
                if (response.status === 403) {
                    toast.error(t("accessDenied") || "ليس لديك صلاحية لحذف المستخدم");
                } else if (response.status === 404) {
                    toast.error(t("userNotFound") || "المستخدم غير موجود");
                } else {
                    toast.error(error || t("deleteUserError"));
                }
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

    // Separate users by role
    const studentUsers = filteredUsers.filter(user => user.role === "USER");
    const staffUsers = filteredUsers.filter(user => user.role === "TEACHER" || user.role === "ADMIN");

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

    const getRoleText = (role: string) => {
        if (role === "TEACHER") return t("teacher");
        if (role === "ADMIN") return t("admin");
        return t("student");
    };


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
                                                    user.role === "TEACHER" ? "bg-blue-600 text-white hover:bg-blue-700" : 
                                                    user.role === "ADMIN" ? "bg-orange-600 text-white hover:bg-orange-700" : 
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
                                                            <DialogTitle>{t("editUser")} - {getRoleText(user.role)}</DialogTitle>
                                                            <DialogDescription>
                                                                {t("editUserDescription")}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="fullName" className={isRTL ? "text-right" : "text-left"}>
                                                                    {t("fullName")}
                                                                </Label>
                                                                <Input
                                                                    id="fullName"
                                                                    value={editData.fullName}
                                                                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                                                                    className="col-span-3"
                                                                    style={{ direction: isRTL ? "rtl" : "ltr" }}
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="phoneNumber" className={isRTL ? "text-right" : "text-left"}>
                                                                    {t("phoneNumberLabel")}
                                                                </Label>
                                                                <Input
                                                                    id="phoneNumber"
                                                                    value={editData.phoneNumber}
                                                                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                    dir="ltr"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="parentPhoneNumber" className={isRTL ? "text-right" : "text-left"}>
                                                                    {t("parentPhoneLabel")}
                                                                </Label>
                                                                <Input
                                                                    id="parentPhoneNumber"
                                                                    value={editData.parentPhoneNumber}
                                                                    onChange={(e) => setEditData({...editData, parentPhoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                    dir="ltr"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="role" className={isRTL ? "text-right" : "text-left"}>
                                                                    {t("role")}
                                                                </Label>
                                                                <Select
                                                                    value={editData.role}
                                                                    onValueChange={(value) => setEditData({...editData, role: value})}
                                                                >
                                                                    <SelectTrigger className="col-span-3">
                                                                        <SelectValue placeholder={t("selectRole") || "اختر الدور"} />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="USER">{t("student")}</SelectItem>
                                                                        <SelectItem value="TEACHER">{t("teacher")}</SelectItem>
                                                                        <SelectItem value="ADMIN">{t("admin")}</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => {
                                                                setIsEditDialogOpen(false);
                                                                setEditingUser(null);
                                                            }}>
                                                                {t("cancel")}
                                                            </Button>
                                                            <Button onClick={handleSaveUser}>
                                                                {t("saveChanges")}
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
                                                            <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
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
                                            <Badge 
                                                variant="secondary"
                                                className="bg-green-600 text-white hover:bg-green-700"
                                            >
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
                                                            <DialogTitle>{t("editUser")} - {t("student")}</DialogTitle>
                                                            <DialogDescription>
                                                                {t("editUserDescription")}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="fullName" className={isRTL ? "text-right" : "text-left"}>
                                                                    {t("fullName")}
                                                                </Label>
                                                                <Input
                                                                    id="fullName"
                                                                    value={editData.fullName}
                                                                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                                                                    className="col-span-3"
                                                                    style={{ direction: isRTL ? "rtl" : "ltr" }}
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="phoneNumber" className={isRTL ? "text-right" : "text-left"}>
                                                                    {t("phoneNumberLabel")}
                                                                </Label>
                                                                <Input
                                                                    id="phoneNumber"
                                                                    value={editData.phoneNumber}
                                                                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                    dir="ltr"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="parentPhoneNumber" className={isRTL ? "text-right" : "text-left"}>
                                                                    {t("parentPhoneLabel")}
                                                                </Label>
                                                                <Input
                                                                    id="parentPhoneNumber"
                                                                    value={editData.parentPhoneNumber}
                                                                    onChange={(e) => setEditData({...editData, parentPhoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                    dir="ltr"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="role" className={isRTL ? "text-right" : "text-left"}>
                                                                    {t("role")}
                                                                </Label>
                                                                <Select
                                                                    value={editData.role}
                                                                    onValueChange={(value) => setEditData({...editData, role: value})}
                                                                >
                                                                    <SelectTrigger className="col-span-3">
                                                                        <SelectValue placeholder={t("selectRole") || "اختر الدور"} />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="USER">{t("student")}</SelectItem>
                                                                        <SelectItem value="TEACHER">{t("teacher")}</SelectItem>
                                                                        <SelectItem value="ADMIN">{t("admin")}</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => {
                                                                setIsEditDialogOpen(false);
                                                                setEditingUser(null);
                                                            }}>
                                                                {t("cancel")}
                                                            </Button>
                                                            <Button onClick={handleSaveUser}>
                                                                {t("saveChanges")}
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
                                                            <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
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

            {staffUsers.length === 0 && studentUsers.length === 0 && !loading && (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-muted-foreground">
                            {t("noUsersRegistered")}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default UsersPage;
