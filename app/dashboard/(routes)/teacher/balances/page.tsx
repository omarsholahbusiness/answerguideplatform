"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Edit, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface User {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    balance: number;
}

const TeacherBalancesPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newBalance, setNewBalance] = useState("");
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

    const handleBalanceUpdate = async () => {
        if (!selectedUser || !newBalance) {
            toast.error(t("enterNewBalance"));
            return;
        }

        const balance = parseFloat(newBalance);
        if (isNaN(balance) || balance < 0) {
            toast.error(t("enterValidBalance"));
            return;
        }

        try {
            const response = await fetch(`/api/teacher/users/${selectedUser.id}/balance`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newBalance: balance }),
            });

            if (response.ok) {
                toast.success(t("updateBalanceSuccess"));
                setNewBalance("");
                setIsDialogOpen(false);
                setSelectedUser(null);
                fetchUsers(); // Refresh the list
            } else {
                toast.error(t("updateBalanceError"));
            }
        } catch (error) {
            console.error("Error updating balance:", error);
            toast.error(t("updateBalanceError"));
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
    );

    const studentUsers = filteredUsers.filter(user => user.role === "USER");

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
                    {t("manageBalancesTitle")}
                </h1>
            </div>

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
                                    <TableHead className={isRTL ? "text-right" : "text-left"}>{t("role")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("currentBalance")}</TableHead>
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
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {t("student")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell dir="ltr">
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <Wallet className="h-3 w-3" />
                                                {user.balance} {t("egp")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={isRTL ? "text-right" : "text-left"}>
                                            <div className={`flex items-center ${isRTL ? "justify-end" : "justify-start"}`}>
                                                <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setNewBalance(user.balance.toString());
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                                {t("updateBalance")}
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

            {studentUsers.length === 0 && !loading && (
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
                        setNewBalance("");
                        setSelectedUser(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t("updateBalance")} {selectedUser?.fullName}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newBalance">{t("newBalance")} ({t("egp")})</Label>
                            <Input
                                id="newBalance"
                                type="number"
                                value={newBalance}
                                onChange={(e) => setNewBalance(e.target.value)}
                                placeholder={t("enterAmount")}
                                min="0"
                                step="0.01"
                                dir="ltr"
                            />
                        </div>
                        <div className={`flex ${isRTL ? "justify-end" : "justify-start"} ${isRTL ? "space-x-reverse" : ""} space-x-2`}>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setNewBalance("");
                                    setSelectedUser(null);
                                }}
                            >
                                {t("cancel")}
                            </Button>
                            <Button onClick={handleBalanceUpdate}>
                                {t("updateBalance")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TeacherBalancesPage;
