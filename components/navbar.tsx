"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { ScrollProgress } from "@/components/scroll-progress";
import { LogOut, Globe, Check } from "lucide-react";
import { useRTL } from "@/components/providers/rtl-provider";
import { useTranslations } from "@/lib/use-translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const { data: session } = useSession();
  const { language, setLanguage, isRTL } = useRTL();
  const { t } = useTranslations();

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleLanguageChange = (lang: "ar" | "en") => {
    setLanguage(lang);
  };

  return (
    <div className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={100}
              height={100}
              className={isRTL ? "ml-2" : "mr-2"}
              unoptimized
            />
          </Link>

          {/* Right side items */}
          <div className="flex items-center gap-4">
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

            {!session ? (
              <>
                <Button className="bg-[#0083d3] hover:bg-[#0083d3]/90 text-white" asChild>
                  <Link href="/sign-up">{t("signUp")}</Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="border-[#0083d3] text-[#0083d3] hover:bg-[#0083d3]/10"
                >
                  <Link href="/sign-in">{t("signIn")}</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">{t("dashboard")}</Link>
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 ease-in-out"
                >
                  <LogOut className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`}/>
                  {t("signOut")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <ScrollProgress />
    </div>
  );
};
