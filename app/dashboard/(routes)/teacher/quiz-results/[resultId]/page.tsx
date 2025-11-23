"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, FileText, User, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { parseQuizOptions } from "@/lib/utils";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface QuizResult {
    id: string;
    studentId: string;
    quizId: string;
    score: number;
    totalPoints: number;
    submittedAt: string;
    user: {
        fullName: string;
        phoneNumber: string;
    };
    quiz: {
        title: string;
        course: {
            id: string;
            title: string;
        };
    };
    answers: QuizAnswer[];
}

interface QuizAnswer {
    id: string;
    questionId: string;
    answer: string;
    isCorrect: boolean;
    points: number;
    question: {
        text: string;
        type: string;
        points: number;
        options?: string[];
        correctAnswer?: string;
        imageUrl?: string;
    };
}

const QuizResultDetailPage = ({ params }: { params: Promise<{ resultId: string }> }) => {
    const router = useRouter();
    const [result, setResult] = useState<QuizResult | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslations();
    const { isRTL, language } = useRTL();
    const dateLocale = language === "ar" ? ar : enUS;
    
    // Unwrap the params Promise
    const resolvedParams = use(params);
    const { resultId } = resolvedParams;

    useEffect(() => {
        fetchQuizResult();
    }, [resultId]);

    const fetchQuizResult = async () => {
        try {
            const response = await fetch(`/api/teacher/quiz-results/${resultId}`);
            if (response.ok) {
                const data = await response.json();
                // Parse options for multiple choice questions
                const parsedData = {
                    ...data,
                    answers: data.answers.map((answer: any) => ({
                        ...answer,
                        question: {
                            ...answer.question,
                            options: parseQuizOptions(answer.question.options)
                        }
                    }))
                };
                setResult(parsedData);
            } else {
                toast.error(t("resultNotFound"));
                router.push("/dashboard/teacher/quiz-results");
            }
        } catch (error) {
            console.error("Error fetching quiz result:", error);
            toast.error(t("loadResultError"));
        } finally {
            setLoading(false);
        }
    };

    const calculatePercentage = (score: number, totalPoints: number) => {
        return totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    };

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return "text-green-600";
        if (percentage >= 80) return "text-green-500";
        if (percentage >= 70) return "text-green-400";
        if (percentage >= 60) return "text-orange-600";
        return "text-red-600";
    };

    const getGradeBadge = (percentage: number) => {
        if (percentage >= 90) return { variant: "default" as const, text: t("excellent") };
        if (percentage >= 80) return { variant: "default" as const, text: t("veryGood") };
        if (percentage >= 70) return { variant: "secondary" as const, text: t("good") };
        if (percentage >= 60) return { variant: "outline" as const, text: t("acceptable") };
        return { variant: "destructive" as const, text: t("weak") };
    };

    const renderQuestionChoices = (answer: QuizAnswer) => {
        if (answer.question.type === "MULTIPLE_CHOICE" && answer.question.options) {
            return (
                <div className="space-y-2">
                    <h5 className={`font-medium text-sm ${isRTL ? "text-right" : "text-left"}`}>{t("optionsLabel")}:</h5>
                    <div className="space-y-1">
                        {answer.question.options.map((option: string, optionIndex: number) => (
                            <div
                                key={optionIndex}
                                className={`p-2 rounded border ${
                                    option === answer.answer
                                        ? answer.isCorrect
                                            ? "bg-green-50 border-green-200"
                                            : "bg-red-50 border-red-200"
                                        : option === answer.question.correctAnswer
                                        ? "bg-green-50 border-green-200"
                                        : "bg-gray-50"
                                }`}
                            >
                                <span className="text-sm" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                    {optionIndex + 1}. {option}
                                    {option === answer.answer && (
                                        <Badge variant={answer.isCorrect ? "default" : "destructive"} className={isRTL ? "mr-2" : "ml-2"}>
                                            {t("studentAnswerLabel")}
                                        </Badge>
                                    )}
                                    {option === answer.question.correctAnswer && option !== answer.answer && (
                                        <Badge variant="default" className={isRTL ? "mr-2" : "ml-2"}>
                                            {t("correctAnswerLabel")}
                                        </Badge>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center">{t("loading")}</div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="p-6">
                <div className="text-center">{t("resultNotFound")}</div>
            </div>
        );
    }

    const percentage = calculatePercentage(result.score, result.totalPoints);
    const grade = getGradeBadge(percentage);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-4`}>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard/teacher/quiz-results")}
                    >
                        <ArrowLeft className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t("return")}
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                        {t("resultDetails")}
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("studentAndQuizInfo")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-3`}>
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    <div className={isRTL ? "text-right" : "text-left"}>
                                        <h4 className="font-medium">{t("student")}</h4>
                                        <p className="text-sm text-muted-foreground" style={{ direction: isRTL ? "rtl" : "ltr" }}>{result.user.fullName}</p>
                                        <p className="text-xs text-muted-foreground" dir="ltr">{result.user.phoneNumber}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-3`}>
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <div className={isRTL ? "text-right" : "text-left"}>
                                        <h4 className="font-medium">{t("quizLabel")}</h4>
                                        <p className="text-sm text-muted-foreground" style={{ direction: isRTL ? "rtl" : "ltr" }}>{result.quiz.title}</p>
                                        <p className="text-xs text-muted-foreground" style={{ direction: isRTL ? "rtl" : "ltr" }}>{result.quiz.course.title}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-3`}>
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div className={isRTL ? "text-right" : "text-left"}>
                                        <h4 className="font-medium">{t("submissionDate")}</h4>
                                        <p className="text-sm text-muted-foreground" dir="ltr">
                                            {format(new Date(result.submittedAt), "dd/MM/yyyy", { locale: dateLocale })}
                                        </p>
                                    </div>
                                </div>
                                <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-3`}>
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <div className={isRTL ? "text-right" : "text-left"}>
                                        <h4 className="font-medium">{t("submissionTime")}</h4>
                                        <p className="text-sm text-muted-foreground" dir="ltr">
                                            {format(new Date(result.submittedAt), "HH:mm", { locale: dateLocale })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("finalResult")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold" dir="ltr">{result.score} / {result.totalPoints}</div>
                                    <p className={`text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("grade")}</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className={`text-2xl font-bold ${getGradeColor(percentage)}`} dir="ltr">
                                        {percentage}%
                                    </div>
                                    <p className={`text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("percentage")}</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <Badge variant={grade.variant} className="text-lg px-4 py-2">
                                        {grade.text}
                                    </Badge>
                                    <p className={`text-sm text-muted-foreground mt-2 ${isRTL ? "text-right" : "text-left"}`}>{t("evaluation")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("answerDetails")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {result.answers.map((answer, index) => (
                                <div key={answer.id} className="border rounded-lg p-4">
                                    <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between mb-3`}>
                                        <h4 className={`font-medium ${isRTL ? "text-right" : "text-left"}`}>{t("questionNumber")} {index + 1}</h4>
                                        <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-2`}>
                                            <Badge variant="outline" dir="ltr">{answer.question.points} {t("point")}</Badge>
                                            {answer.isCorrect ? (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-600" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <p className={`text-muted-foreground mb-3 ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>{answer.question.text}</p>
                                    
                                    {/* Question Image */}
                                    {answer.question.imageUrl && (
                                        <div className="mb-3">
                                            <img 
                                                src={answer.question.imageUrl} 
                                                alt="Question" 
                                                className="max-w-full h-auto max-h-64 rounded-lg border shadow-sm"
                                            />
                                        </div>
                                    )}
                                    
                                    {answer.question.type === "MULTIPLE_CHOICE" && renderQuestionChoices(answer)}
                                    
                                    {answer.question.type === "TRUE_FALSE" && (
                                        <div className="space-y-2">
                                            <h5 className={`font-medium text-sm ${isRTL ? "text-right" : "text-left"}`}>{t("correctAnswerLabel")}:</h5>
                                            <div className="space-y-1">
                                                <div className={`p-2 rounded border ${
                                                    answer.question.correctAnswer === "true"
                                                        ? "bg-green-50 border-green-200"
                                                        : "bg-gray-50"
                                                }`}>
                                                    <span className={`text-sm ${isRTL ? "text-right" : "text-left"}`}>{t("true")}</span>
                                                    {answer.question.correctAnswer === "true" && (
                                                        <Badge variant="default" className={isRTL ? "mr-2" : "ml-2"}>{t("correctAnswerLabel")}</Badge>
                                                    )}
                                                </div>
                                                <div className={`p-2 rounded border ${
                                                    answer.question.correctAnswer === "false"
                                                        ? "bg-green-50 border-green-200"
                                                        : "bg-gray-50"
                                                }`}>
                                                    <span className={`text-sm ${isRTL ? "text-right" : "text-left"}`}>{t("false")}</span>
                                                    {answer.question.correctAnswer === "false" && (
                                                        <Badge variant="default" className={isRTL ? "mr-2" : "ml-2"}>{t("correctAnswerLabel")}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`mt-2 ${isRTL ? "text-right" : "text-left"}`}>
                                                <span className="text-sm font-medium">{t("studentAnswerLabel")}: </span>
                                                <Badge variant={answer.isCorrect ? "default" : "destructive"}>
                                                    {answer.answer === "true" ? t("true") : t("false")}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {answer.question.type === "SHORT_ANSWER" && (
                                        <div className="space-y-2">
                                            <h5 className={`font-medium text-sm ${isRTL ? "text-right" : "text-left"}`}>{t("correctAnswerLabel")}:</h5>
                                            <p className={`text-sm bg-green-50 p-2 rounded border border-green-200 ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                                {answer.question.correctAnswer}
                                            </p>
                                            <div className={`mt-2 ${isRTL ? "text-right" : "text-left"}`}>
                                                <span className="text-sm font-medium">{t("studentAnswerLabel")}: </span>
                                                <p className={`text-sm p-2 rounded border ${
                                                    answer.isCorrect 
                                                        ? "bg-green-50 border-green-200" 
                                                        : "bg-red-50 border-red-200"
                                                } ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                                    {answer.answer}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="mt-3 pt-3 border-t">
                                        <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}>
                                            <span className={`text-sm font-medium ${isRTL ? "text-right" : "text-left"}`}>{t("pointsEarned")}:</span>
                                            <span className={`text-sm font-medium ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                                                {answer.points} / {answer.question.points}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("resultSummary")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}>
                                <span className={isRTL ? "text-right" : "text-left"}>{t("totalPoints")}</span>
                                <Badge variant="default" dir="ltr">{result.totalPoints} {t("point")}</Badge>
                            </div>
                            <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}>
                                <span className={isRTL ? "text-right" : "text-left"}>{t("pointsEarned")}</span>
                                <Badge variant="secondary" dir="ltr">{result.score} {t("point")}</Badge>
                            </div>
                            <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}>
                                <span className={isRTL ? "text-right" : "text-left"}>{t("pointsLost")}</span>
                                <Badge variant="outline" dir="ltr">{result.totalPoints - result.score} {t("point")}</Badge>
                            </div>
                            <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}>
                                <span className={isRTL ? "text-right" : "text-left"}>{t("correctQuestionsCount")}</span>
                                <Badge variant="default" dir="ltr">
                                    {result.answers.filter(a => a.isCorrect).length} {t("questionCount")}
                                </Badge>
                            </div>
                            <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}>
                                <span className={isRTL ? "text-right" : "text-left"}>{t("incorrectQuestionsCount")}</span>
                                <Badge variant="destructive" dir="ltr">
                                    {result.answers.filter(a => !a.isCorrect).length} {t("questionCount")}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("actionsLabel")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/teacher/quiz-results?quizId=${result.quizId}`)}
                            >
                                {t("viewAllQuizResults")}
                            </Button>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/teacher/quizzes/${result.quizId}`)}
                            >
                                {t("viewQuizDetails")}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default QuizResultDetailPage; 