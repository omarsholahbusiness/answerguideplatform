"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button"
import { LogOut, Globe, Check } from "lucide-react";
import Link from "next/link";
import { UserButton } from "./user-button";
import { useSession, signOut } from "next-auth/react";
import { LoadingButton } from "@/components/ui/loading-button";
import { useState } from "react";
import { useRTL } from "@/components/providers/rtl-provider";
import { useTranslations } from "@/lib/use-translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const NavbarRoutes = () => {
    const { data: session } = useSession();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { language, setLanguage, isRTL } = useRTL();
    const { t } = useTranslations();

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

    const handleLanguageChange = (lang: "ar" | "en") => {
        setLanguage(lang);
    };

    return (
        <div className="flex items-center gap-x-2 rtl:mr-auto ltr:ml-auto">
            {/* Language Toggle Dropdown - Icon only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 hover:bg-[#0083d3]/10"
                  title={language === "ar" ? "Change Language" : "تغيير اللغة"}
                >
                  <Globe className="h-5 w-5 text-[#0083d3]" />
                  <span className="sr-only">Change language</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem
                  onClick={() => handleLanguageChange("ar")}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <span>العربية</span>
                  {language === "ar" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLanguageChange("en")}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <span>English</span>
                  {language === "en" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout button for all user types */}
            {session?.user && (
                <LoadingButton 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleLogout}
                    loading={isLoggingOut}
                    loadingText={isRTL ? "جاري تسجيل الخروج..." : "Logging out..."}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 ease-in-out"
                >
                    <LogOut className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`}/>
                    {t("signOut")}
                </LoadingButton>
            )}
            
            <UserButton />
        </div>
    )
}