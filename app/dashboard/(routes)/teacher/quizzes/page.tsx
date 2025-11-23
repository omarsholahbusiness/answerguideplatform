"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface Quiz {
    id: string;
    title: string;
    description: string;
    courseId: string;
    position: number;
    isPublished: boolean;
    course: {
        title: string;
    };
    questions: Question[];
    createdAt: string;
    updatedAt: string;
}

interface Question {
    id: string;
    text: string;
    imageUrl?: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
    options?: string[];
    correctAnswer: string;
    points: number;
}

const QuizzesPage = () => {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { t } = useTranslations();
    const { isRTL } = useRTL();

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const response = await fetch("/api/teacher/quizzes");
            if (response.ok) {
                const data = await response.json();
                setQuizzes(data);
            }
        } catch (error) {
            console.error("Error fetching quizzes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async (quiz: Quiz) => {
        if (!confirm(t("deleteQuizConfirm"))) {
            return;
        }

        setIsDeleting(quiz.id);
        try {
            const response = await fetch(`/api/courses/${quiz.courseId}/quizzes/${quiz.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success(t("deleteQuizSuccess"));
                fetchQuizzes();
            } else {
                toast.error(t("deleteQuizError"));
            }
        } catch (error) {
            console.error("Error deleting quiz:", error);
            toast.error(t("deleteQuizError"));
        } finally {
            setIsDeleting(null);
        }
    };

    const handleViewQuiz = (quiz: Quiz) => {
        router.push(`/dashboard/teacher/quizzes/${quiz.id}`);
    };

    const filteredQuizzes = quizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.course.title.toLowerCase().includes(searchTerm.toLowerCase())
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
                    {t("manageQuizzes")}
                </h1>
                <Button onClick={() => router.push("/dashboard/teacher/quizzes/create")}>
                    <Plus className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
                    {t("createNewQuiz")}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("quizzes")}</CardTitle>
                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-2`}>
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("searchQuizzes")}
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
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("quizTitle")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("course")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("position")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("status")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("questionsCount")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("createdDate")}</TableHead>
                                <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[180px]`}>{t("actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredQuizzes.map((quiz) => (
                                <TableRow key={quiz.id}>
                                    <TableCell className="font-medium" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                        {quiz.title}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {quiz.course.title}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {quiz.position}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                                            {quiz.isPublished ? t("published") : t("draft")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {quiz.questions.length} {t("question")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell dir="ltr">
                                        {new Date(quiz.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US")}
                                    </TableCell>
                                    <TableCell className={isRTL ? "text-right" : "text-left"}>
                                        <div className={`flex items-center gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => handleViewQuiz(quiz)}
                                            >
                                                <Eye className="h-4 w-4" />
                                                {t("view")}
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}/edit`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                                {t("edit")}
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant={quiz.isPublished ? "destructive" : "default"}
                                                onClick={async () => {
                                                    try {
                                                        const response = await fetch(`/api/teacher/quizzes/${quiz.id}/publish`, {
                                                            method: "PATCH",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                            },
                                                            body: JSON.stringify({
                                                                isPublished: !quiz.isPublished
                                                            }),
                                                        });
                                                        if (response.ok) {
                                                            toast.success(quiz.isPublished ? t("unpublishSuccess") : t("publishSuccess"));
                                                            fetchQuizzes();
                                                        }
                                                    } catch (error) {
                                                        toast.error(t("errorOccurred"));
                                                    }
                                                }}
                                            >
                                                {quiz.isPublished ? t("unpublish") : t("publish")}
                                            </Button>

                                            <Button 
                                                size="sm" 
                                                variant="destructive"
                                                onClick={() => handleDeleteQuiz(quiz)}
                                                disabled={isDeleting === quiz.id}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                {isDeleting === quiz.id ? t("deleting") : t("deleteQuiz")}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default QuizzesPage; 