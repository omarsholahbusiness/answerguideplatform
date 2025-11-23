"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
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
  course: { id: string; title: string };
  questions: { id: string }[];
  createdAt: string;
}

export default function AdminQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { t } = useTranslations();
  const { isRTL } = useRTL();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch("/api/admin/quizzes");
        if (response.ok) {
          const data = await response.json();
          setQuizzes(data);
        } else {
          toast.error(t("loadQuizzesError"));
        }
      } catch (e) {
        toast.error(t("loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter((quiz) =>
    [quiz.title, quiz.course.title].some((v) => v.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (quizId: string, quizTitle: string) => {
    const confirmed = window.confirm(`${t("deleteQuizConfirmTitle")} "${quizTitle}"? ${t("deleteQuizConfirmWarning")}`);
    if (!confirmed) {
      return;
    }

    setDeletingId(quizId);
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || t("deleteQuizFailed"));
      }

      setQuizzes((previous) => previous.filter((quiz) => quiz.id !== quizId));
      toast.success(t("deleteQuizSuccess"));
    } catch (error) {
      console.error("[ADMIN_DELETE_QUIZ]", error);
      toast.error(error instanceof Error ? error.message : t("deleteQuizFailed"));
    } finally {
      setDeletingId(null);
    }
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
        <h1 className="text-3xl font-bold">{t("allQuizzes")}</h1>
        <Button onClick={() => router.push("/dashboard/admin/quizzes/create")}> 
          <Plus className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
          {t("createQuiz")}
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
                <TableHead className={`${isRTL ? "text-right" : "text-left"} w-[180px]`}>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell className="font-medium" style={{ direction: isRTL ? "rtl" : "ltr" }}>{quiz.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{quiz.course.title}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{quiz.position}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                      {quiz.isPublished ? t("published") : t("draft")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{quiz.questions.length} {t("question")}</Badge>
                  </TableCell>
                  <TableCell className={isRTL ? "text-right" : "text-left"}>
                    <div className={`flex items-center ${isRTL ? "justify-end" : "justify-start"} gap-2`}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/admin/quizzes/${quiz.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4" />
                      {t("edit")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === quiz.id}
                      onClick={() => handleDelete(quiz.id, quiz.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === quiz.id ? t("deleting") : t("deleteQuiz")}
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
}


