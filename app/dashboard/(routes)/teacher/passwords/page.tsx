"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Eye, Edit, Search, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface User {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
}

const TeacherPasswordsPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { t } = useTranslations();
    const { isRTL } = useRTL();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/teacher/users");
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!selectedUser || !newPassword) {
            toast.error(t("enterNewPasswordRequired"));
            return;
        }

        try {
            const response = await fetch(`/api/teacher/users/${selectedUser.id}/password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newPassword }),
            });

            if (response.ok) {
                toast.success(t("passwordChangedSuccess"));
                setNewPassword("");
                setIsDialogOpen(false);
                setSelectedUser(null);
            } else {
                toast.error(t("passwordChangeError"));
            }
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error(t("passwordChangeError"));
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
    );

    const staffUsers = filteredUsers.filter(user => user.role === "ADMIN" || user.role === "TEACHER");
    const studentUsers = filteredUsers.filter(user => user.role === "USER");

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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                    {t("passwordManagement")}
                </h1>
            </div>

            {/* Staff Table (Admins and Teachers) */}
            {staffUsers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("adminStaff")}</CardTitle>
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
                                    <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[180px]`}>{t("actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staffUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                            {user.fullName}
                                        </TableCell>
                                        <TableCell dir="ltr">{user.phoneNumber}</TableCell>
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
                                        <TableCell className={isRTL ? "text-right" : "text-left"}>
                                            <div className={`flex items-center ${isRTL ? "justify-end" : "justify-start"}`}>
                                                <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Edit className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                                                {t("changePassword")}
                                            </Button>
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
                                    <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[180px]`}>{t("actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentUsers.map((user) => (
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
                                        <TableCell className={isRTL ? "text-right" : "text-left"}>
                                            <div className={`flex items-center ${isRTL ? "justify-end" : "justify-start"}`}>
                                                <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Edit className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                                                {t("changePassword")}
                                            </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {filteredUsers.length === 0 && !loading && (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-muted-foreground">
                            {t("noUsersAvailable")}
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
                        setNewPassword("");
                        setSelectedUser(null);
                        setShowPassword(false);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={isRTL ? "text-right" : "text-left"}>
                            {t("changePasswordFor")} {selectedUser?.fullName}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className={isRTL ? "text-right" : "text-left"}>{t("newPassword")}</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder={t("enterNewPassword")}
                                    style={{ direction: isRTL ? "rtl" : "ltr" }}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={`absolute ${isRTL ? "right-0" : "left-0"} top-0 h-full px-3 py-2 hover:bg-transparent`}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className={`flex ${isRTL ? "justify-start" : "justify-end"} ${isRTL ? "space-x-reverse" : ""} space-x-2`}>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setNewPassword("");
                                    setSelectedUser(null);
                                }}
                            >
                                {t("cancel")}
                            </Button>
                            <Button onClick={handlePasswordChange}>
                                {t("changePassword")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TeacherPasswordsPage;
