"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { ChevronRight, LogOut } from "lucide-react";
import { CourseMobileSidebar } from "./course-mobile-sidebar";
import { UserButton } from "@/components/user-button";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useTranslations } from "@/lib/use-translations";
import { useRTL } from "@/components/providers/rtl-provider";

export const CourseNavbar = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { t } = useTranslations();
  const { isRTL } = useRTL();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="p-4 h-full flex items-center bg-card text-foreground border-b shadow-sm">
      <div className="flex items-center">
        <CourseMobileSidebar />
        <Button
          onClick={handleBackToDashboard}
          variant="ghost"
          size="sm"
          className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-x-2 hover:bg-slate-100 ${isRTL ? "mr-2" : "ml-2"}`}
        >
          <span className={isRTL ? "text-right" : "text-left"} style={{ direction: isRTL ? "rtl" : "ltr" }}>{t("backToCourses")}</span>
          <ChevronRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
        </Button>
      </div>
      <div className={`flex items-center ${isRTL ? "space-x-reverse" : ""} gap-x-4 ${isRTL ? "mr-auto" : "ml-auto"}`}>
        {session?.user && (
          <LoadingButton 
            size="sm" 
            variant="ghost" 
            onClick={handleLogout}
            loading={isLoggingOut}
            loadingText={t("signingOut")}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 ease-in-out"
          >
            <LogOut className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`}/>
            {t("logout")}
          </LoadingButton>
        )}
        <UserButton />
      </div>
    </div>
  );
}; 