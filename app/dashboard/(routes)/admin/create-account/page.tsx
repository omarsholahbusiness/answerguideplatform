"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreatedUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: string;
}

export default function CreateAccountPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const { t } = useTranslations();
  const { isRTL } = useRTL();
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    grade: "",
    studyType: "",
    governorate: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: "grade" | "studyType" | "governorate", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePasswords = () => {
    return {
      match: formData.password === formData.confirmPassword,
      isValid: formData.password === formData.confirmPassword && formData.password.length > 0,
    };
  };

  const passwordChecks = validatePasswords();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!passwordChecks.isValid) {
      toast.error(t("passwordsDoNotMatch"));
      setIsLoading(false);
      return;
    }

    if (!formData.grade || !formData.studyType || !formData.governorate) {
      toast.error(t("completeRegistrationData"));
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/admin/create-account", formData);
      
      if (response.data.success) {
        setCreatedUser(response.data.user);
        toast.success(t("studentAccountCreatedSuccess"));
        // Reset form
        setFormData({
          fullName: "",
          phoneNumber: "",
          parentPhoneNumber: "",
          grade: "",
          studyType: "",
          governorate: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Create account error:", axiosError.response?.data || axiosError.message);
      
      if (axiosError.response?.status === 400) {
        const errorData = axiosError.response.data;
        const errorMessage = typeof errorData === "string" ? errorData : (errorData as any)?.message || String(errorData);
        
        if (errorMessage.includes("Phone number already exists")) {
          toast.error(t("phoneExists"));
        } else if (errorMessage.includes("Parent phone number already exists")) {
          toast.error(t("parentPhoneExists"));
        } else if (errorMessage.includes("Phone number cannot be the same as parent phone number")) {
          toast.error(t("phoneCannotMatchParent"));
        } else if (errorMessage.includes("Passwords do not match")) {
          toast.error(t("passwordsDoNotMatch"));
        } else if (errorMessage.includes("Missing required fields")) {
          toast.error(t("completeRegistrationData"));
        } else {
          toast.error(errorMessage || t("signUpError"));
        }
      } else if (axiosError.response?.status === 500) {
        const errorData = axiosError.response.data;
        const errorMessage = typeof errorData === "string" ? errorData : (errorData as any)?.message || String(errorData);
        console.error("Server error:", errorMessage);
        toast.error(errorMessage || t("signUpError"));
      } else {
        console.error("Unknown error:", axiosError);
        toast.error(t("signUpError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      phoneNumber: "",
      parentPhoneNumber: "",
      grade: "",
      studyType: "",
      governorate: "",
      password: "",
      confirmPassword: "",
    });
    setCreatedUser(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className={`flex items-center ${isRTL ? "gap-4" : "gap-4"}`}>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin/users">
              <ArrowLeft className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
              {t("back")}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("createStudentAccount")}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {createdUser ? (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                {t("accountCreatedSuccess")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-green-700 dark:text-green-300">{t("fullNameLabel")}</Label>
                  <p className="text-green-800 dark:text-green-200 font-semibold">{createdUser.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-green-700 dark:text-green-300">{t("phoneNumberLabel")}</Label>
                  <p className="text-green-800 dark:text-green-200 font-semibold" dir="ltr">{createdUser.phoneNumber}</p>
                </div>
              </div>
              <div className={`flex ${isRTL ? "gap-4" : "gap-4"}`}>
                <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700 text-white">
                  {t("createAnotherAccount")}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/admin/users">
                    {t("viewAllUsers")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {t("studentInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("fullName")} *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder={t("enterFullName")}
                      required
                      style={{ direction: isRTL ? "rtl" : "ltr" }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">{t("phoneNumber")} *</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder={t("enterPhoneNumber")}
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentPhoneNumber">{t("parentPhone")} *</Label>
                  <Input
                    id="parentPhoneNumber"
                    name="parentPhoneNumber"
                    type="tel"
                    value={formData.parentPhoneNumber}
                    onChange={handleInputChange}
                    placeholder={t("enterParentPhone")}
                    required
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">{t("grade")} *</Label>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) => handleSelectChange("grade", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={t("selectGrade")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="الأول الثانوي">{t("firstSecondary")}</SelectItem>
                        <SelectItem value="الثاني الثانوي">{t("secondSecondary")}</SelectItem>
                        <SelectItem value="الثالث الثانوي">{t("thirdSecondary")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studyType">{t("studyType")} *</Label>
                    <Select
                      value={formData.studyType}
                      onValueChange={(value) => handleSelectChange("studyType", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={t("selectStudyType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="سنتر">سنتر</SelectItem>
                        <SelectItem value="أون لاين">أون لاين</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="governorate">{t("governorate")} *</Label>
                    <Select
                      value={formData.governorate}
                      onValueChange={(value) => handleSelectChange("governorate", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={t("selectGovernorate")} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        <SelectItem value="القاهرة">القاهرة</SelectItem>
                        <SelectItem value="الجيزة">الجيزة</SelectItem>
                        <SelectItem value="الإسكندرية">الإسكندرية</SelectItem>
                        <SelectItem value="الدقهلية">الدقهلية</SelectItem>
                        <SelectItem value="الشرقية">الشرقية</SelectItem>
                        <SelectItem value="المنوفية">المنوفية</SelectItem>
                        <SelectItem value="القليوبية">القليوبية</SelectItem>
                        <SelectItem value="البحيرة">البحيرة</SelectItem>
                        <SelectItem value="الغربية">الغربية</SelectItem>
                        <SelectItem value="بورسعيد">بورسعيد</SelectItem>
                        <SelectItem value="دمياط">دمياط</SelectItem>
                        <SelectItem value="الإسماعيلية">الإسماعيلية</SelectItem>
                        <SelectItem value="السويس">السويس</SelectItem>
                        <SelectItem value="كفر الشيخ">كفر الشيخ</SelectItem>
                        <SelectItem value="الفيوم">الفيوم</SelectItem>
                        <SelectItem value="بني سويف">بني سويف</SelectItem>
                        <SelectItem value="المنيا">المنيا</SelectItem>
                        <SelectItem value="أسيوط">أسيوط</SelectItem>
                        <SelectItem value="سوهاج">سوهاج</SelectItem>
                        <SelectItem value="قنا">قنا</SelectItem>
                        <SelectItem value="أسوان">أسوان</SelectItem>
                        <SelectItem value="الأقصر">الأقصر</SelectItem>
                        <SelectItem value="البحر الأحمر">البحر الأحمر</SelectItem>
                        <SelectItem value="الوادي الجديد">الوادي الجديد</SelectItem>
                        <SelectItem value="مطروح">مطروح</SelectItem>
                        <SelectItem value="شمال سيناء">شمال سيناء</SelectItem>
                        <SelectItem value="جنوب سيناء">جنوب سيناء</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("password")} *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder={t("enterPassword")}
                        required
                        dir="ltr"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`absolute ${isRTL ? "left-0" : "right-0"} top-0 h-full px-3 py-2 hover:bg-transparent`}
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("confirmPassword")} *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder={t("enterConfirmPassword")}
                        required
                        dir="ltr"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`absolute ${isRTL ? "left-0" : "right-0"} top-0 h-full px-3 py-2 hover:bg-transparent`}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {formData.password && formData.confirmPassword && (
                  <div className={`text-sm ${passwordChecks.match ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordChecks.match ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        {t("passwordsMatch")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                        {t("passwordsDoNotMatch")}
                      </span>
                    )}
                  </div>
                )}

                <div className={`flex ${isRTL ? "gap-4" : "gap-4"}`}>
                  <Button
                    type="submit"
                    disabled={isLoading || !passwordChecks.isValid}
                    className="flex-1 bg-[#005bd3] hover:bg-[#005bd3]/90 text-white"
                  >
                    {isLoading ? t("creating") : t("createAccount")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    {t("reset")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 