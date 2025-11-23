"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { auth } from "@/lib/auth";
import { ArrowLeft, CreditCard, Wallet, AlertCircle, Ticket, CheckCircle, X } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: number | null;
}

export default function PurchasePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const router = useRouter();
  const { courseId } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [promocode, setPromocode] = useState("");
  const [isValidatingPromocode, setIsValidatingPromocode] = useState(false);
  const [promocodeValidation, setPromocodeValidation] = useState<{
    valid: boolean;
    discountAmount: string;
    finalPrice: string;
    originalPrice: string;
    error?: string;
  } | null>(null);
  const { t } = useTranslations();
  const { isRTL } = useRTL();

  useEffect(() => {
    fetchCourse();
    fetchUserBalance();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        toast.error(t("loadCourseError"));
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error(t("loadCourseError"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch("/api/user/balance");
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleValidatePromocode = async () => {
    if (!promocode.trim() || !course) return;

    setIsValidatingPromocode(true);
    try {
      const response = await fetch("/api/promocodes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: promocode.trim(),
          courseId: course.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPromocodeValidation({
          valid: true,
          discountAmount: data.discountAmount,
          finalPrice: data.finalPrice,
          originalPrice: data.originalPrice,
        });
        toast.success(t("promocodeApplied"));
      } else {
        const errorData = await response.json();
        setPromocodeValidation({
          valid: false,
          discountAmount: "0.00",
          finalPrice: (course.price || 0).toFixed(2),
          originalPrice: (course.price || 0).toFixed(2),
          error: errorData.error || t("promocodeInvalid"),
        });
        toast.error(errorData.error || t("promocodeInvalid"));
      }
    } catch (error) {
      console.error("Error validating promocode:", error);
      toast.error(t("promocodeError"));
    } finally {
      setIsValidatingPromocode(false);
    }
  };

  const handleRemovePromocode = () => {
    setPromocode("");
    setPromocodeValidation(null);
  };

  const handlePurchase = async () => {
    if (!course) return;

    setIsPurchasing(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promocode: promocodeValidation?.valid ? promocode.trim() : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(t("purchaseSuccess"));
        router.push("/dashboard");
      } else {
        const error = await response.text();
        if (error.includes("Insufficient balance")) {
          toast.error(t("insufficientBalance"));
        } else if (error.includes("already purchased")) {
          toast.error(t("alreadyPurchased"));
        } else {
          toast.error(error || t("purchaseError"));
        }
      }
    } catch (error) {
      console.error("Error purchasing course:", error);
      toast.error(t("purchaseError"));
    } finally {
      setIsPurchasing(false);
    }
  };

  const finalPrice = promocodeValidation?.valid 
    ? parseFloat(promocodeValidation.finalPrice)
    : (course?.price || 0);
  
  const hasSufficientBalance = course && userBalance >= finalPrice;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0083d3]"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("courseNotFound")}</h1>
          <Button asChild>
            <Link href="/dashboard">{t("returnToDashboard")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-4`}>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-2`}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Button>
            <h1 className="text-2xl font-bold" style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("purchaseTitle")}</h1>
          </div>

          {/* Course Details */}
          <Card>
            <CardHeader>
              <CardTitle style={{ direction: isRTL ? "rtl" : "ltr" }}>{course.title}</CardTitle>
              <CardDescription style={{ direction: isRTL ? "rtl" : "ltr" }}>
                {course.description || t("noCourseDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course.imageUrl && (
                <div className="mb-4">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="space-y-2">
                {promocodeValidation?.valid && (
                  <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-2 text-muted-foreground line-through`}>
                    <span>{t("originalPrice")}</span>
                    <span dir="ltr">{promocodeValidation.originalPrice} {t("currency")}</span>
                  </div>
                )}
                <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-2`}>
                  {promocodeValidation?.valid && (
                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-1 text-green-600`}>
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium" dir="ltr">
                        {t("discount")} {promocodeValidation.discountAmount} {t("currency")}
                      </span>
                    </div>
                  )}
                  <div className="text-2xl font-bold text-[#0083d3]" dir="ltr">
                    {finalPrice.toFixed(2)} {t("currency")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promocode Section */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-2`}>
                <Ticket className="h-5 w-5" />
                {t("promocodeLabel")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!promocodeValidation?.valid ? (
                  <div className={`flex ${isRTL ? "space-x-reverse" : ""} gap-2`}>
                    <Input
                      value={promocode}
                      onChange={(e) => setPromocode(e.target.value.toUpperCase())}
                      placeholder={t("promocodePlaceholder")}
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleValidatePromocode();
                        }
                      }}
                    />
                    <Button
                      onClick={handleValidatePromocode}
                      disabled={!promocode.trim() || isValidatingPromocode}
                      variant="outline"
                    >
                      {isValidatingPromocode ? t("validating") : t("applyButton")}
                    </Button>
                  </div>
                ) : (
                  <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between p-3 bg-green-50 border border-green-200 rounded-lg`}>
                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-2 text-green-700`}>
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium" dir="ltr">
                        {promocode} - {t("discount")} {promocodeValidation.discountAmount} {t("currency")}
                      </span>
                    </div>
                    <Button
                      onClick={handleRemovePromocode}
                      variant="ghost"
                      size="sm"
                      className="text-green-700 hover:text-green-900"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {promocodeValidation && !promocodeValidation.valid && promocodeValidation.error && (
                  <div className={`text-sm text-red-600 flex items-center ${isRTL ? "space-x-reverse" : ""} gap-1`}>
                    <AlertCircle className="h-4 w-4" />
                    <span>{promocodeValidation.error}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Balance Information */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-2`}>
                <Wallet className="h-5 w-5" />
                {t("accountBalance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBalance ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0083d3]"></div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xl font-bold" dir="ltr">
                    {userBalance.toFixed(2)} {t("currency")}
                  </div>
                  {!hasSufficientBalance && (
                    <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-2 text-amber-600`}>
                      <AlertCircle className="h-4 w-4" />
                      <span>{t("insufficientBalanceMessage")}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Actions */}
          <div className="space-y-4">
            {!hasSufficientBalance && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-2 text-amber-700 mb-4`}>
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{t("insufficientBalanceTitle")}</span>
                  </div>
                  <p className={`text-amber-700 mb-4 ${isRTL ? "text-right" : "text-left"}`}>
                    {t("needMoreBalance")} {(finalPrice - userBalance).toFixed(2)} {t("currency")} {t("needMoreBalanceAdditional")}
                  </p>
                  <Button asChild className="bg-[#0083d3] hover:bg-[#0083d3]/90">
                    <Link href="/dashboard/balance">{t("addBalance")}</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handlePurchase}
              disabled={isPurchasing || !hasSufficientBalance}
              className="w-full bg-[#0083d3] hover:bg-[#0083d3]/90 text-white"
              size="lg"
            >
              {isPurchasing ? (
                t("purchasing")
              ) : (
                <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-2`}>
                  <CreditCard className="h-5 w-5" />
                  {t("purchaseCourse")}
                </div>
              )}
            </Button>

            <div className={`text-center text-sm text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>
              <p dir="ltr">{t("willDeduct")} {finalPrice.toFixed(2)} {t("currency")} {t("fromYourBalance")}</p>
              {promocodeValidation?.valid && (
                <p className="text-green-600 font-medium" dir="ltr">
                  {t("appliedDiscount")} {promocodeValidation.discountAmount} {t("currency")} {t("applied")}
                </p>
              )}
              <p>{t("accessAfterPurchase")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 