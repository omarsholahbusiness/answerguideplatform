"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowLeft, Eye, Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
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
    };
}

const QuizResultsContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const quizId = searchParams.get('quizId');
    const { t } = useTranslations();
    const { isRTL, language } = useRTL();
    const dateLocale = language === "ar" ? ar : enUS;
    
    const [results, setResults] = useState<QuizResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [quizDetails, setQuizDetails] = useState<any>(null);
    const [filteredResults, setFilteredResults] = useState<QuizResult[]>([]);

    useEffect(() => {
        if (quizId) {
            fetchQuizResults();
            fetchQuizDetails();
        } else {
            toast.error(t("quizNotSelected"));
            router.push("/dashboard/teacher/quizzes");
        }
    }, [quizId]);

    useEffect(() => {
        // Filter results based on search term
        let filtered = results;
        
        if (searchTerm) {
            filtered = filtered.filter(result =>
                result.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                result.user.phoneNumber.includes(searchTerm)
            );
        }
        
        setFilteredResults(filtered);
    }, [results, searchTerm]);

    const fetchQuizResults = async () => {
        try {
            const response = await fetch(`/api/teacher/quiz-results?quizId=${quizId}`);
            if (response.ok) {
                const data = await response.json();
                setResults(data);
            } else {
                toast.error(t("loadResultsError"));
            }
        } catch (error) {
            console.error("Error fetching quiz results:", error);
            toast.error(t("loadResultsError"));
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizDetails = async () => {
        try {
            const response = await fetch(`/api/teacher/quizzes/${quizId}`);
            if (response.ok) {
                const data = await response.json();
                setQuizDetails(data);
            }
        } catch (error) {
            console.error("Error fetching quiz details:", error);
        }
    };

    const handleViewDetails = (result: QuizResult) => {
        router.push(`/dashboard/teacher/quiz-results/${result.id}`);
    };

    const calculatePercentage = (score: number, totalPoints: number) => {
        return totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    };

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return "text-green-600";
        if (percentage >= 80) return "text-blue-600";
        if (percentage >= 70) return "text-yellow-600";
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

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center">{t("loading")}</div>
            </div>
        );
    }

    if (!quizId) {
        return (
            <div className="p-6">
                <div className="text-center">{t("quizNotSelected")}</div>
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
                        {t("quizResultsTitle")}: {quizDetails?.title || t("loading")}
                    </h1>
                </div>
            </div>

            {quizDetails && (
                <Card>
                    <CardHeader>
                        <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("quizInfo")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className={`font-medium mb-1 ${isRTL ? "text-right" : "text-left"}`}>{t("quizTitleLabel")}</h4>
                                <p className="text-sm text-muted-foreground" style={{ direction: isRTL ? "rtl" : "ltr" }}>{quizDetails.title}</p>
                            </div>
                            <div>
                                <h4 className={`font-medium mb-1 ${isRTL ? "text-right" : "text-left"}`}>{t("courseLabel")}</h4>
                                <p className="text-sm text-muted-foreground" style={{ direction: isRTL ? "rtl" : "ltr" }}>{quizDetails.course?.title}</p>
                            </div>
                            <div>
                                <h4 className={`font-medium mb-1 ${isRTL ? "text-right" : "text-left"}`}>{t("questionsCountLabel")}</h4>
                                <Badge variant="secondary" dir="ltr">
                                    {quizDetails.questions?.length || 0} {t("questionCount")}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${isRTL ? "text-right" : "text-left"}`}>{t("totalResults")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" dir="ltr">{results.length}</div>
                        <p className={`text-xs text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("result")}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${isRTL ? "text-right" : "text-left"}`}>{t("averageGrade")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" dir="ltr">
                            {results.length > 0 
                                ? Math.round(results.reduce((sum, r) => sum + calculatePercentage(r.score, r.totalPoints), 0) / results.length)
                                : 0
                            }%
                        </div>
                        <p className={`text-xs text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("average")}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${isRTL ? "text-right" : "text-left"}`}>{t("highestGrade")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600" dir="ltr">
                            {results.length > 0 
                                ? Math.max(...results.map(r => calculatePercentage(r.score, r.totalPoints)))
                                : 0
                            }%
                        </div>
                        <p className={`text-xs text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("bestResult")}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${isRTL ? "text-right" : "text-left"}`}>{t("lowestGrade")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600" dir="ltr">
                            {results.length > 0 
                                ? Math.min(...results.map(r => calculatePercentage(r.score, r.totalPoints)))
                                : 0
                            }%
                        </div>
                        <p className={`text-xs text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("worstResult")}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("studentResults")}</CardTitle>
                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-2`}>
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("searchStudents")}
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
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("student")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("grade")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("percentage")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"}>{t("evaluation")}</TableHead>
                                <TableHead className={isRTL ? "text-right" : "text-left"} dir="ltr">{t("submissionDate")}</TableHead>
                                <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[120px]`}>{t("actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredResults.map((result) => {
                                const percentage = calculatePercentage(result.score, result.totalPoints);
                                const grade = getGradeBadge(percentage);
                                
                                return (
                                    <TableRow key={result.id}>
                                        <TableCell className="font-medium" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                            <div>
                                                <div>{result.user.fullName}</div>
                                                <div className="text-sm text-muted-foreground" dir="ltr">
                                                    {result.user.phoneNumber}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell dir="ltr">
                                            <div className="font-medium">
                                                {result.score} / {result.totalPoints}
                                            </div>
                                        </TableCell>
                                        <TableCell dir="ltr">
                                            <div className={`font-medium ${getGradeColor(percentage)}`}>
                                                {percentage}%
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={grade.variant}>
                                                {grade.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell dir="ltr">
                                            <div className="text-sm text-muted-foreground">
                                                {format(new Date(result.submittedAt), "dd/MM/yyyy", { locale: dateLocale })}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(result.submittedAt), "HH:mm", { locale: dateLocale })}
                                            </div>
                                        </TableCell>
                                        <TableCell className={isRTL ? "text-right" : "text-left"}>
                                            <div className={`flex items-center ${isRTL ? "justify-end" : "justify-start"}`}>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleViewDetails(result)}
                                                >
                                                    <Eye className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                                                    {t("details")}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    
                    {filteredResults.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">{t("noResultsToDisplay")}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const QuizResultsPage = () => {
    return (
        <Suspense fallback={
            <div className="p-6">
                <div className="text-center">جاري التحميل...</div>
            </div>
        }>
            <QuizResultsContent />
        </Suspense>
    );
};

export default QuizResultsPage; 