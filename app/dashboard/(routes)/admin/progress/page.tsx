"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Search, Eye, BookOpen, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface User {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    _count: {
        purchases: number;
        userProgress: number;
    };
}

interface UserProgress {
    id: string;
    isCompleted: boolean;
    updatedAt: string;
    chapter: {
        id: string;
        title: string;
        course: {
            id: string;
            title: string;
        };
    };
}

interface Chapter {
    id: string;
    title: string;
    isPublished: boolean;
    course: {
        id: string;
        title: string;
    };
}

interface Purchase {
    id: string;
    status: string;
    createdAt: string;
    course: {
        id: string;
        title: string;
        price: number;
    };
}

const ProgressPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
    const [userPurchases, setUserPurchases] = useState<Purchase[]>([]);
    const [allChapters, setAllChapters] = useState<Chapter[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(false);
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
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProgress = async (userId: string) => {
        setLoadingProgress(true);
        try {
            const response = await fetch(`/api/admin/users/${userId}/progress`);
            if (response.ok) {
                const data = await response.json();
                setUserProgress(data.userProgress);
                setUserPurchases(data.purchases);
                setAllChapters(data.allChapters || []);
            }
        } catch (error) {
            console.error("Error fetching user progress:", error);
        } finally {
            setLoadingProgress(false);
        }
    };

    const handleViewProgress = (user: User) => {
        setSelectedUser(user);
        fetchUserProgress(user.id);
        setIsDialogOpen(true);
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
    );

    const studentUsers = filteredUsers.filter(user => user.role === "USER");

    const completedProgress = userProgress.filter(p => p.isCompleted).length;
    const inProgressChapters = userProgress.filter(p => !p.isCompleted).length;
    const totalAvailableChapters = allChapters.length;
    const notStartedChapters = totalAvailableChapters - completedProgress - inProgressChapters;
    const progressPercentage = totalAvailableChapters > 0 ? (completedProgress / totalAvailableChapters) * 100 : 0;

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
                    {t("studentProgressTitle")}
                </h1>
            </div>

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
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("purchasedCourses")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("progress")}</TableHead>
                                <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[150px]`}>{t("actions")}</TableHead>
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
                                        <Badge variant="outline">
                                            {user._count.purchases} {t("courses")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {user._count.userProgress} {t("chapters")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={isRTL ? "text-right" : "text-left"}>
                                        <div className={`flex items-center ${isRTL ? "justify-end" : "justify-start"}`}>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => handleViewProgress(user)}
                                            >
                                                <Eye className="h-4 w-4" />
                                                {t("viewProgress")}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {t("progress")} {selectedUser?.fullName}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {loadingProgress ? (
                        <div className="text-center py-8">{t("loading")}</div>
                    ) : (
                        <div className="space-y-6">
                            {/* Progress Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("progressSummary")}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className={`flex items-center ${isRTL ? "justify-between" : "justify-between"}`}>
                                            <span>{t("completionRate")}</span>
                                            <span className="font-bold" dir="ltr">{progressPercentage.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={progressPercentage} className="w-full" />
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div>
                                                <div className="text-2xl font-bold text-green-600">{completedProgress}</div>
                                                <div className="text-sm text-muted-foreground">{t("completed")}</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-gray-600">{notStartedChapters}</div>
                                                <div className="text-sm text-muted-foreground">{t("notStarted")}</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Purchased Courses */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("purchasedCourses")}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("courseName")}</TableHead>
                                                <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("coursePrice")}</TableHead>
                                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("purchaseStatus")}</TableHead>
                                                <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("purchaseDate")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userPurchases.map((purchase) => (
                                                <TableRow key={purchase.id}>
                                                    <TableCell className="font-medium" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                                        {purchase.course.title}
                                                    </TableCell>
                                                    <TableCell dir="ltr">
                                                        {purchase.course.price} {t("egp")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={purchase.status === "ACTIVE" ? "default" : "secondary"}>
                                                            {purchase.status === "ACTIVE" ? t("active") : t("inactive")}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell dir="ltr">
                                                        {format(new Date(purchase.createdAt), "dd/MM/yyyy", { locale: dateLocale })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Progress Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("progressDetails")}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("course")}</TableHead>
                                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("chapter")}</TableHead>
                                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("status")}</TableHead>
                                                <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("lastUpdate")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allChapters.map((chapter) => {
                                                const progress = userProgress.find(p => p.chapter.id === chapter.id);
                                                return (
                                                    <TableRow key={chapter.id}>
                                                        <TableCell className="font-medium" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                                            {chapter.course.title}
                                                        </TableCell>
                                                        <TableCell style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                                            {chapter.title}
                                                        </TableCell>
                                                        <TableCell>
                                                            {progress ? (
                                                                progress.isCompleted ? (
                                                                    <Badge variant="default" className="flex items-center gap-1">
                                                                        <CheckCircle className="h-3 w-3" />
                                                                        {t("completed")}
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="secondary" className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {t("inProgress")}
                                                                    </Badge>
                                                                )
                                                            ) : (
                                                                <Badge variant="outline" className="flex items-center gap-1">
                                                                    <BookOpen className="h-3 w-3" />
                                                                    {t("notStarted")}
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell dir="ltr">
                                                            {progress ? (
                                                                format(new Date(progress.updatedAt), "dd/MM/yyyy", { locale: dateLocale })
                                                            ) : (
                                                                "-"
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProgressPage; 