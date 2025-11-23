"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, X, Mic } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useParams, usePathname } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { UploadDropzone } from "@/lib/uploadthing";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface Course {
    id: string;
    title: string;
    isPublished: boolean;
}

interface Chapter {
    id: string;
    title: string;
    position: number;
    isPublished: boolean;
}

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
    timer?: number;
    maxAttempts?: number;
}

interface Question {
    id: string;
    text: string;
    imageUrl?: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
    options?: string[];
    correctAnswer: string | number; // Can be string for TRUE_FALSE/SHORT_ANSWER or number for MULTIPLE_CHOICE
    points: number;
}

interface CourseItem {
    id: string;
    title: string;
    type: "chapter" | "quiz";
    position: number;
    isPublished: boolean;
}

const EditQuizPage = () => {
    const router = useRouter();
    const params = useParams();
    const quizId = params.quizId as string;
    const pathname = usePathname();
    const dashboardPath = pathname.includes("/dashboard/admin/")
        ? "/dashboard/admin/quizzes"
        : "/dashboard/teacher/quizzes";
    const { t } = useTranslations();
    const { isRTL } = useRTL();
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [quizTitle, setQuizTitle] = useState("");
    const [quizDescription, setQuizDescription] = useState("");
    const [quizTimer, setQuizTimer] = useState<number | null>(null);
    const [maxAttempts, setMaxAttempts] = useState<number>(1);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<number>(1);
    const [courseItems, setCourseItems] = useState<CourseItem[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoadingCourseItems, setIsLoadingCourseItems] = useState(false);
    const [isUpdatingQuiz, setIsUpdatingQuiz] = useState(false);
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
    const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});
    const [listeningQuestionId, setListeningQuestionId] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        fetchCourses();
        fetchQuiz();
    }, [quizId]);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await fetch("/api/courses");
            if (response.ok) {
                const data = await response.json();
                const teacherCourses = data.filter((course: Course) => course.isPublished);
                setCourses(teacherCourses);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    const fetchQuiz = async () => {
        try {
            const response = await fetch(`/api/teacher/quizzes/${quizId}`);
            if (response.ok) {
                const quiz: Quiz = await response.json();
                setQuizTitle(quiz.title);
                setQuizDescription(quiz.description);
                setQuizTimer(quiz.timer || null);
                setMaxAttempts(quiz.maxAttempts || 1);
                setSelectedCourse(quiz.courseId);
                
                // Convert stored string correctAnswer values back to indices for multiple choice questions
                const processedQuestions = quiz.questions.map(question => {
                    if (question.type === "MULTIPLE_CHOICE" && question.options) {
                        const validOptions = question.options.filter(option => option.trim() !== "");
                        const correctAnswerIndex = validOptions.findIndex(option => option === question.correctAnswer);
                        return {
                            ...question,
                            correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0
                        };
                    }
                    return question;
                });
                
                setQuestions(processedQuestions);
                setSelectedPosition(quiz.position);
                await fetchCourseItems(quiz.courseId);
            } else {
                toast.error(t("quizLoadError"));
                router.push(dashboardPath);
            }
        } catch (error) {
            console.error("Error fetching quiz:", error);
            toast.error(t("quizLoadError"));
            router.push(dashboardPath);
        } finally {
            setIsLoadingQuiz(false);
        }
    };

    const fetchCourseItems = async (courseId: string) => {
        try {
            setIsLoadingCourseItems(true);
            // Clear existing items first
            setCourseItems([]);
            
            const [chaptersResponse, quizzesResponse] = await Promise.all([
                fetch(`/api/courses/${courseId}/chapters`),
                fetch(`/api/courses/${courseId}/quizzes`)
            ]);
            
            const chaptersData = chaptersResponse.ok ? await chaptersResponse.json() : [];
            const quizzesData = quizzesResponse.ok ? await quizzesResponse.json() : [];
            
            // Combine chapters and existing quizzes for display
            const items: CourseItem[] = [
                ...chaptersData.map((chapter: Chapter) => ({
                    id: chapter.id,
                    title: chapter.title,
                    type: "chapter" as const,
                    position: chapter.position,
                    isPublished: chapter.isPublished
                })),
                ...quizzesData.map((quiz: Quiz) => ({
                    id: quiz.id,
                    title: quiz.title,
                    type: "quiz" as const,
                    position: quiz.position,
                    isPublished: quiz.isPublished
                }))
            ];
            
            // Sort by position
            items.sort((a, b) => a.position - b.position);
            
            setCourseItems(items);
            setChapters(chaptersData);
            
            // Update the selected position to reflect the actual position of the quiz in the list
            const quizInList = items.find(item => item.id === quizId);
            if (quizInList) {
                setSelectedPosition(quizInList.position);
            }
        } catch (error) {
            console.error("Error fetching course items:", error);
            // Clear items on error
            setCourseItems([]);
        } finally {
            setIsLoadingCourseItems(false);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (error) {
                console.error("[SPEECH_RECOGNITION_STOP]", error);
            }
            recognitionRef.current = null;
        }
        setListeningQuestionId(null);
    };

    const handleSpeechInput = (index: number) => {
        if (typeof window === "undefined") {
            return;
        }

        const question = questions[index];
        if (!question) {
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error(t("browserNoSpeechRecognition"));
            return;
        }

        if (listeningQuestionId === question.id) {
            stopListening();
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = "ar-SA";
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setListeningQuestionId(question.id);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results?.[0]?.[0]?.transcript;
                if (transcript) {
                    setQuestions((prev) => {
                        const updated = [...prev];
                        const current = updated[index];
                        if (!current) {
                            return prev;
                        }
                        const newText = current.text ? `${current.text} ${transcript}` : transcript;
                        updated[index] = { ...current, text: newText };
                        return updated;
                    });
                }
            };

            recognition.onerror = (event: any) => {
                console.error("[SPEECH_RECOGNITION_ERROR]", event.error);
                toast.error(t("speechRecognitionError"));
            };

            recognition.onend = () => {
                setListeningQuestionId(null);
                recognitionRef.current = null;
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (error) {
            console.error("[SPEECH_RECOGNITION]", error);
            toast.error(t("speechRecognitionStartError"));
            stopListening();
        }
    };

    const handleUpdateQuiz = async () => {
        stopListening();
        if (!selectedCourse || !quizTitle.trim()) {
            toast.error(t("fillRequiredFields"));
            return;
        }

        // Validate questions
        const validationErrors: string[] = [];

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            
            // Validate question text
            if (!question.text || question.text.trim() === "") {
                validationErrors.push(`${t("questionNumberLabel")} ${i + 1}: ${t("questionRequired")}`);
                continue;
            }

            // Validate correct answer
            if (question.type === "MULTIPLE_CHOICE") {
                const validOptions = question.options?.filter(option => option.trim() !== "") || [];
                if (validOptions.length === 0) {
                    validationErrors.push(`${t("questionNumberLabel")} ${i + 1}: ${t("addAtLeastOneOption")}`);
                    continue;
                }
                
                // Check if correct answer index is valid
                if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer >= validOptions.length) {
                    validationErrors.push(`${t("questionNumberLabel")} ${i + 1}: ${t("selectCorrectAnswerRequired")}`);
                    continue;
                }
            } else if (question.type === "TRUE_FALSE") {
                if (!question.correctAnswer || (question.correctAnswer !== "true" && question.correctAnswer !== "false")) {
                    validationErrors.push(`${t("questionNumberLabel")} ${i + 1}: ${t("selectCorrectAnswerRequired")}`);
                    continue;
                }
            } else if (question.type === "SHORT_ANSWER") {
                if (!question.correctAnswer || question.correctAnswer.toString().trim() === "") {
                    validationErrors.push(`${t("questionNumberLabel")} ${i + 1}: ${t("correctAnswerRequired")}`);
                    continue;
                }
            }

            // Check if points are valid
            if (question.points <= 0) {
                validationErrors.push(`${t("questionNumberLabel")} ${i + 1}: ${t("pointsMustBeGreaterThanZero")}`);
                continue;
            }
        }

        if (validationErrors.length > 0) {
            toast.error(validationErrors.join('\n'));
            return;
        }

        // Additional validation: ensure no questions are empty
        if (questions.length === 0) {
            toast.error(t("addAtLeastOneQuestion"));
            return;
        }

        // Clean up questions before sending
        const cleanedQuestions = questions.map(question => {
            if (question.type === "MULTIPLE_CHOICE" && question.options) {
                // Filter out empty options and ensure correct answer is included
                const filteredOptions = question.options.filter(option => option.trim() !== "");
                return {
                    ...question,
                    options: filteredOptions
                };
            }
            return question;
        });

        setIsUpdatingQuiz(true);
        try {
            const response = await fetch(`/api/teacher/quizzes/${quizId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: quizTitle,
                    description: quizDescription,
                    courseId: selectedCourse,
                    questions: cleanedQuestions,
                    position: selectedPosition,
                    timer: quizTimer,
                    maxAttempts: maxAttempts,
                }),
            });

            if (response.ok) {
                toast.success(t("quizUpdatedSuccess"));
                router.push(dashboardPath);
            } else {
                const error = await response.json();
                toast.error(error.message || t("quizUpdateError"));
            }
        } catch (error) {
            console.error("Error updating quiz:", error);
            toast.error(t("quizUpdateError"));
        } finally {
            setIsUpdatingQuiz(false);
        }
    };

    const addQuestion = () => {
        const newQuestion: Question = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: "",
            type: "MULTIPLE_CHOICE",
            options: ["", "", "", ""],
            correctAnswer: 0, // Default to index 0 for MULTIPLE_CHOICE
            points: 1,
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
        setQuestions(updatedQuestions);
    };

    const removeQuestion = (index: number) => {
        if (questions[index]?.id === listeningQuestionId) {
            stopListening();
        }
        const updatedQuestions = questions.filter((_, i) => i !== index);
        setQuestions(updatedQuestions);
    };

    const handleDragEnd = async (result: any) => {
        if (!result.destination) return;

        // Handle dragging the quiz being edited
        if (result.draggableId === quizId) {
            // Calculate the position for the quiz based on where it was dropped
            const newQuizPosition = result.destination.index + 1;
            setSelectedPosition(newQuizPosition);
            
            // Reorder the items array to reflect the new position
            const reorderedItems = Array.from(courseItems);
            const [movedItem] = reorderedItems.splice(result.source.index, 1);
            reorderedItems.splice(result.destination.index, 0, movedItem);
            
            setCourseItems(reorderedItems);

            // Create update data for all items with type information
            const updateData = reorderedItems.map((item, index) => ({
                id: item.id,
                type: item.type,
                position: index + 1,
            }));

            // Call the mixed reorder API
            try {
                const response = await fetch(`/api/courses/${selectedCourse}/reorder`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        list: updateData
                    }),
                });

                if (response.ok) {
                    toast.success(t("quizReorderedSuccess"));
                } else {
                    toast.error(t("quizReorderError"));
                }
            } catch (error) {
                console.error("Error reordering quiz:", error);
                toast.error(t("quizReorderError"));
            }
        }
        // For other items, we don't want to reorder them, so we ignore the drag
        // The drag and drop library will handle the visual feedback, but we don't update state
    };

    if (isLoadingQuiz) {
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
                    {t("editQuiz")}
                </h1>
                <Button variant="outline" onClick={() => router.push(dashboardPath)}>
                    {t("returnToQuizzes")}
                </Button>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className={isRTL ? "text-right" : "text-left"}>{t("selectCourseLabel")}</Label>
                        <Select value={selectedCourse} onValueChange={(value) => {
                            setSelectedCourse(value);
                            // Clear previous data immediately
                            setCourseItems([]);
                            // Don't reset position when changing course - keep the quiz's current position
                            if (value) {
                                fetchCourseItems(value);
                            }
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("selectCoursePlaceholder")} />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className={isRTL ? "text-right" : "text-left"}>{t("quizTitleLabel")}</Label>
                        <Input
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            placeholder={t("enterQuizTitle")}
                            style={{ direction: isRTL ? "rtl" : "ltr" }}
                        />
                    </div>
                </div>

                {selectedCourse && (
                    <Card>
                        <CardHeader>
                            <CardTitle className={isRTL ? "text-right" : "text-left"}>{t("quizOrder")}</CardTitle>
                            <p className={`text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>
                                {t("dragQuizToPositionEdit")}
                            </p>
                            <p className={`text-sm text-blue-600 ${isRTL ? "text-right" : "text-left"}`} dir="ltr">
                                {t("selectedPosition")}: {selectedPosition}
                            </p>
                        </CardHeader>
                        <CardContent>
                            {isLoadingCourseItems ? (
                                <div className="text-center py-8">
                                    <div className="text-muted-foreground">{t("loadingCourseContent")}</div>
                                </div>
                            ) : courseItems.length > 0 ? (
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="course-items">
                                        {(provided) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="space-y-2"
                                            >
                                                {courseItems.map((item, index) => (
                                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`p-3 border rounded-lg flex items-center justify-between ${
                                                                    snapshot.isDragging ? "bg-blue-50" : "bg-white"
                                                                } ${item.id === quizId ? "border-2 border-dashed border-blue-300 bg-blue-50" : ""}`}
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <div {...provided.dragHandleProps} className={item.id === quizId ? "cursor-grab active:cursor-grabbing" : ""}>
                                                                        <GripVertical className={`h-4 w-4 ${item.id === quizId ? "text-blue-600" : "text-gray-300 cursor-not-allowed"}`} />
                                                                    </div>
                                                                    <div>
                                                                        <div className={`font-medium ${item.id === quizId ? "text-blue-800" : ""}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                                                            {item.title}
                                                                        </div>
                                                                        <div className={`text-sm ${item.id === quizId ? "text-blue-600" : "text-muted-foreground"}`}>
                                                                            {item.type === "chapter" ? t("chapterLabel") : t("quiz")}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Badge variant={item.id === quizId ? "outline" : (item.isPublished ? "default" : "secondary")} className={item.id === quizId ? "border-blue-300 text-blue-700" : ""}>
                                                                    {item.id === quizId ? t("editingLabel") : (item.isPublished ? t("publishedLabel") : t("draftLabel"))}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            ) : (
                                <div className="text-center py-8">
                                    <p className={`text-muted-foreground mb-4 ${isRTL ? "text-right" : "text-left"}`}>
                                        {t("noChaptersOrQuizzes")}
                                    </p>
                                    <div className="p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                                        <div className={`flex items-center justify-center ${isRTL ? "space-x-reverse" : ""} space-x-3`}>
                                            <div>
                                                <div className="font-medium text-blue-800" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                                                    {quizTitle || t("newQuiz")}
                                                </div>
                                                <div className="text-sm text-blue-600">{t("quiz")}</div>
                                            </div>
                                            <Badge variant="outline" className="border-blue-300 text-blue-700">
                                                {t("editingLabel")}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-2">
                    <Label className={isRTL ? "text-right" : "text-left"}>{t("quizDescriptionLabel")}</Label>
                    <Textarea
                        value={quizDescription}
                        onChange={(e) => setQuizDescription(e.target.value)}
                        placeholder={t("enterQuizDescription")}
                        rows={3}
                        style={{ direction: isRTL ? "rtl" : "ltr" }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className={isRTL ? "text-right" : "text-left"}>{t("quizDuration")}</Label>
                        <Input
                            type="number"
                            value={quizTimer || ""}
                            onChange={(e) => setQuizTimer(e.target.value ? parseInt(e.target.value) : null)}
                            placeholder={t("quizDurationPlaceholder")}
                            min="1"
                            dir="ltr"
                        />
                        <p className={`text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>
                            {t("quizDurationHint")}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label className={isRTL ? "text-right" : "text-left"}>{t("maxAttemptsLabel")}</Label>
                        <Input
                            type="number"
                            value={maxAttempts || ""}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                    setMaxAttempts(1);
                                } else {
                                    const num = parseInt(value);
                                    setMaxAttempts(isNaN(num) ? 1 : Math.max(1, num));
                                }
                            }}
                            placeholder="1"
                            min="1"
                            dir="ltr"
                        />
                        <p className={`text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>
                            {t("maxAttemptsHint")}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={`flex items-center ${isRTL ? "justify-between" : "justify-between"}`}>
                        <Label className={isRTL ? "text-right" : "text-left"}>{t("questionsLabel")}</Label>
                        <Button type="button" variant="outline" onClick={addQuestion}>
                            <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                            {t("addQuestion")}
                        </Button>
                    </div>

                    {questions.map((question, index) => (
                        <Card key={question.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                                        <CardTitle className={`text-lg ${isRTL ? "text-right" : "text-left"}`} dir="ltr">{t("questionNumberLabel")} {index + 1}</CardTitle>
                                        {(!question.text.trim() || 
                                            (question.type === "MULTIPLE_CHOICE" && 
                                             (!question.options || question.options.filter(opt => opt.trim() !== "").length === 0)) ||
                                            (question.type === "TRUE_FALSE" && 
                                             (typeof question.correctAnswer !== 'string' || (question.correctAnswer !== "true" && question.correctAnswer !== "false"))) ||
                                            (question.type === "SHORT_ANSWER" && 
                                             (typeof question.correctAnswer !== 'string' || question.correctAnswer.trim() === ""))) && (
                                            <Badge variant="destructive" className="text-xs">
                                                {t("incompleteLabel")}
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeQuestion(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className={`flex items-center ${isRTL ? "justify-between" : "justify-between"}`}>
                                        <Label className={isRTL ? "text-right" : "text-left"}>{t("questionTextLabel")}</Label>
                                        <div className={`flex items-center ${isRTL ? "gap-2-reverse" : ""} gap-2`}>
                                            {listeningQuestionId === question.id && (
                                                <span className="text-xs text-blue-600">
                                                    {t("listeningLabel")}
                                                </span>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-pressed={listeningQuestionId === question.id}
                                                onClick={() => handleSpeechInput(index)}
                                                className={listeningQuestionId === question.id ? "text-red-500 animate-pulse" : ""}
                                            >
                                                <Mic className="h-4 w-4" />
                                                <span className="sr-only">
                                                    {listeningQuestionId === question.id ? t("stopRecording") : t("startRecording")}
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={question.text}
                                        onChange={(e) => updateQuestion(index, "text", e.target.value)}
                                        placeholder={t("enterQuestionText")}
                                        style={{ direction: isRTL ? "rtl" : "ltr" }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className={isRTL ? "text-right" : "text-left"}>{t("questionImageLabel")}</Label>
                                    <div className="space-y-2">
                                        {question.imageUrl ? (
                                            <div className="relative">
                                                <img 
                                                    src={question.imageUrl} 
                                                    alt="Question" 
                                                    className="max-w-full h-auto max-h-48 rounded-lg border"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-2 right-2"
                                                    onClick={() => updateQuestion(index, "imageUrl", "")}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                                <UploadDropzone
                                                    endpoint="courseAttachment"
                                                    onClientUploadComplete={(res) => {
                                                        if (res && res[0]) {
                                                            updateQuestion(index, "imageUrl", res[0].url);
                                                            toast.success(t("imageUploadSuccess"));
                                                        }
                                                        setUploadingImages(prev => ({ ...prev, [index]: false }));
                                                    }}
                                                    onUploadError={(error: Error) => {
                                                        toast.error(`${t("imageUploadError")}: ${error.message}`);
                                                        setUploadingImages(prev => ({ ...prev, [index]: false }));
                                                    }}
                                                    onUploadBegin={() => {
                                                        setUploadingImages(prev => ({ ...prev, [index]: true }));
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className={isRTL ? "text-right" : "text-left"}>{t("questionTypeLabel")}</Label>
                                        <Select
                                            value={question.type}
                                            onValueChange={(value: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER") =>
                                                updateQuestion(index, "type", value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MULTIPLE_CHOICE">{t("multipleChoiceLabel")}</SelectItem>
                                                <SelectItem value="TRUE_FALSE">{t("trueFalseLabel")}</SelectItem>
                                                <SelectItem value="SHORT_ANSWER">{t("shortAnswerLabel")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className={isRTL ? "text-right" : "text-left"}>{t("pointsLabel")}</Label>
                                        <Input
                                            type="number"
                                            value={question.points || ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === "") {
                                                    updateQuestion(index, "points", 1);
                                                } else {
                                                    const num = parseInt(value);
                                                    updateQuestion(index, "points", isNaN(num) ? 1 : Math.max(1, num));
                                                }
                                            }}
                                            min="1"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {question.type === "MULTIPLE_CHOICE" && (
                                    <div className="space-y-2">
                                        <Label className={isRTL ? "text-right" : "text-left"}>{t("optionsLabel")}</Label>
                                        {(question.options || ["", "", "", ""]).map((option, optionIndex) => (
                                            <div key={optionIndex} className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-2`}>
                                                <Input
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...(question.options || ["", "", "", ""])];
                                                        const oldOptionValue = newOptions[optionIndex];
                                                        newOptions[optionIndex] = e.target.value;
                                                        updateQuestion(index, "options", newOptions);
                                                        
                                                        // If this option was the correct answer, update the correct answer to the new value
                                                        if (question.correctAnswer === oldOptionValue) {
                                                            updateQuestion(index, "correctAnswer", optionIndex);
                                                        }
                                                    }}
                                                    placeholder={`${t("optionLabel")} ${optionIndex + 1}`}
                                                    style={{ direction: isRTL ? "rtl" : "ltr" }}
                                                />
                                                <input
                                                    type="radio"
                                                    name={`correct-${index}`}
                                                    checked={question.correctAnswer === optionIndex}
                                                    onChange={() => updateQuestion(index, "correctAnswer", optionIndex)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {question.type === "TRUE_FALSE" && (
                                    <div className="space-y-2">
                                        <Label className={isRTL ? "text-right" : "text-left"}>{t("correctAnswerLabel")}</Label>
                                        <Select
                                            value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                                            onValueChange={(value) => updateQuestion(index, "correctAnswer", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("selectCorrectAnswer")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true">{t("trueLabel")}</SelectItem>
                                                <SelectItem value="false">{t("falseLabel")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {question.type === "SHORT_ANSWER" && (
                                    <div className="space-y-2">
                                        <Label className={isRTL ? "text-right" : "text-left"}>{t("correctAnswerLabel")}</Label>
                                        <Input
                                            value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                                            onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                                            placeholder={t("enterCorrectAnswer")}
                                            style={{ direction: isRTL ? "rtl" : "ltr" }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className={`flex ${isRTL ? "justify-start" : "justify-end"} ${isRTL ? "space-x-reverse" : ""} space-x-2`}>
                    <Button
                        variant="outline"
                        onClick={() => router.push(dashboardPath)}
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        onClick={handleUpdateQuiz}
                        disabled={isUpdatingQuiz || questions.length === 0}
                    >
                        {isUpdatingQuiz ? t("updatingLabel") : t("updateQuizLabel")}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EditQuizPage; 