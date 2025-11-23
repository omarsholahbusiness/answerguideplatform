"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Quiz {
    id: string;
    title: string;
    description: string;
    courseId: string;
    position: number;
    isPublished: boolean;
    course: {
        id: string;
        title: string;
    };
    questions: Question[];
    createdAt: string;
    updatedAt: string;
}

interface Question {
    id: string;
    text: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
    options?: string[];
    correctAnswer: string;
    points: number;
}

const QuizViewPage = ({ params }: { params: Promise<{ quizId: string }> }) => {
    const router = useRouter();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslations();
    const { isRTL, language } = useRTL();
    const dateLocale = language === "ar" ? ar : enUS;
    
    // Unwrap the params Promise
    const resolvedParams = use(params);
    const { quizId } = resolvedParams;

    useEffect(() => {
        fetchQuiz();
    }, [quizId]);

    const fetchQuiz = async () => {
        try {
            const response = await fetch(`/api/teacher/quizzes/${quizId}`);
            if (response.ok) {
                const data = await response.json();
                setQuiz(data);
            } else {
                toast.error(t("quizNotFound"));
                router.push("/dashboard/teacher/quizzes");
            }
        } catch (error) {
            console.error("Error fetching quiz:", error);
            toast.error(t("quizLoadError"));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async () => {
        if (!quiz || !confirm(t("deleteQuizConfirmMessage"))) {
            return;
        }

        try {
            const response = await fetch(`/api/courses/${quiz.courseId}/quizzes/${quiz.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success(t("deleteQuizSuccess"));
                router.push("/dashboard/teacher/quizzes");
            } else {
                toast.error(t("deleteQuizError"));
            }
        } catch (error) {
            console.error("Error deleting quiz:", error);
            toast.error(t("deleteQuizError"));
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center">{t("loading")}</div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="p-6">
                <div className="text-center">{t("quizNotFound")}</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-4`}>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard/teacher/quizzes")}
                    >
                        <ArrowLeft className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t("return")}
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                        {quiz.title}
                    </h1>
                </div>
                <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-2`}>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}/edit`)}
                    >
                        <Edit className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t("edit")}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteQuiz}
                    >
                        <Trash2 className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t("delete")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("quizDetails")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className={`text-lg font-semibold mb-2 ${isRTL ? "text-right" : "text-left"}`}>{t("description")}</h3>
                                <p className="text-muted-foreground" style={{ direction: isRTL ? "rtl" : "ltr" }}>{quiz.description || t("noDescription")}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className={`font-medium mb-1 ${isRTL ? "text-right" : "text-left"}`}>{t("courseLabel")}</h4>
                                    <Badge variant="outline" style={{ direction: isRTL ? "rtl" : "ltr" }}>{quiz.course.title}</Badge>
                                </div>
                                <div>
                                    <h4 className={`font-medium mb-1 ${isRTL ? "text-right" : "text-left"}`}>{t("positionLabel")}</h4>
                                    <Badge variant="secondary" dir="ltr">{quiz.position}</Badge>
                                </div>
                                <div>
                                    <h4 className={`font-medium mb-1 ${isRTL ? "text-right" : "text-left"}`}>{t("statusLabel")}</h4>
                                    <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                                        {quiz.isPublished ? t("publishedLabel") : t("draftLabel")}
                                    </Badge>
                                </div>
                                <div>
                                    <h4 className={`font-medium mb-1 ${isRTL ? "text-right" : "text-left"}`}>{t("questionsCountLabel")}</h4>
                                    <Badge variant="secondary" dir="ltr">{quiz.questions.length} {t("questionCount")}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className={`flex items-center ${isRTL ? "text-right" : "text-left"}`}>
                                <FileText className={`h-5 w-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                                {t("questionsLabel")} ({quiz.questions.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {quiz.questions.map((question, index) => (
                                <div key={question.id} className="border rounded-lg p-4">
                                    <div className={`flex items-center ${isRTL ? "justify-end" : "justify-between"} mb-3`}>
                                        <h4 className={`font-medium ${isRTL ? "text-right" : "text-left"}`} dir="ltr">{t("questionNumberLabel")} {index + 1}</h4>
                                        <Badge variant="outline" dir="ltr">{question.points} {t("point")}</Badge>
                                    </div>
                                    
                                    <p className="text-muted-foreground mb-3" style={{ direction: isRTL ? "rtl" : "ltr" }}>{question.text}</p>
                                    
                                    <div className="space-y-2">
                                        <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-2`}>
                                            <Badge variant="secondary">{question.type}</Badge>
                                        </div>
                                        
                                        {question.type === "MULTIPLE_CHOICE" && question.options && (
                                            <div className="space-y-2">
                                                <h5 className={`font-medium text-sm ${isRTL ? "text-right" : "text-left"}`}>{t("optionsLabel")}:</h5>
                                                <div className="space-y-1">
                                                    {question.options.map((option, optionIndex) => (
                                                        <div
                                                            key={optionIndex}
                                                            className={`p-2 rounded border ${
                                                                option === question.correctAnswer
                                                                    ? "bg-green-50 border-green-200"
                                                                    : "bg-gray-50"
                                                            }`}
                                                        >
                                                            <span className="text-sm" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                                                {optionIndex + 1}. {option}
                                                                {option === question.correctAnswer && (
                                                                    <Badge variant="default" className={isRTL ? "mr-2" : "ml-2"}>
                                                                        {t("correctAnswerLabel")}
                                                                    </Badge>
                                                                )}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {question.type === "TRUE_FALSE" && (
                                            <div className="space-y-2">
                                                <h5 className={`font-medium text-sm ${isRTL ? "text-right" : "text-left"}`}>{t("correctAnswerLabel")}:</h5>
                                                <Badge variant="default">
                                                    {question.correctAnswer === "true" ? t("trueLabel") : t("falseLabel")}
                                                </Badge>
                                            </div>
                                        )}
                                        
                                        {question.type === "SHORT_ANSWER" && (
                                            <div className="space-y-2">
                                                <h5 className={`font-medium text-sm ${isRTL ? "text-right" : "text-left"}`}>{t("correctAnswerLabel")}:</h5>
                                                <p className="text-sm bg-green-50 p-2 rounded border border-green-200" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                                    {question.correctAnswer}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("statistics")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className={isRTL ? "text-right" : "text-left"}>{t("totalPoints")}</span>
                                <Badge variant="default" dir="ltr">
                                    {quiz.questions.reduce((sum, q) => sum + q.points, 0)} {t("point")}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={isRTL ? "text-right" : "text-left"}>{t("createdAtLabel")}</span>
                                <span className="text-sm text-muted-foreground" dir="ltr">
                                    {format(new Date(quiz.createdAt), "dd/MM/yyyy", { locale: dateLocale })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={isRTL ? "text-right" : "text-left"}>{t("lastUpdated")}</span>
                                <span className="text-sm text-muted-foreground" dir="ltr">
                                    {format(new Date(quiz.updatedAt), "dd/MM/yyyy", { locale: dateLocale })}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("quickActions")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}/edit`)}
                            >
                                <Edit className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                                {t("editQuiz")}
                            </Button>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/teacher/quiz-results?quizId=${quiz.id}`)}
                            >
                                <Eye className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                                {t("viewResults")}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default QuizViewPage; 