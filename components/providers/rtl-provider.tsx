"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface RTLContextType {
  isRTL: boolean;
  setIsRTL: (isRTL: boolean) => void;
  language: "ar" | "en";
  setLanguage: (lang: "ar" | "en") => void;
}

const RTLContext = createContext<RTLContextType>({
  isRTL: true,
  setIsRTL: () => {},
  language: "ar",
  setLanguage: () => {},
});

export const useRTL = () => useContext(RTLContext);

export const RTLProvider = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const [isRTL, setIsRTLState] = useState(true);
  const [language, setLanguageState] = useState<"ar" | "en">("ar");

  // Initialize from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const savedLanguage = localStorage.getItem("language") as "ar" | "en" | null;
      if (savedLanguage === "en" || savedLanguage === "ar") {
        setLanguageState(savedLanguage);
        setIsRTLState(savedLanguage === "ar");
        // Also set cookie for server components
        document.cookie = `language=${savedLanguage}; path=/; max-age=31536000; SameSite=Lax`;
      } else {
        // Default to Arabic if no preference is saved
        localStorage.setItem("language", "ar");
        document.cookie = `language=ar; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
  }, []);

  // Note: Document updates are handled by HtmlDirection component
  // to avoid duplicate updates and SSR issues

  const setLanguage = (lang: "ar" | "en") => {
    setLanguageState(lang);
    setIsRTLState(lang === "ar");
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem("language", lang);
      // Also set cookie for server components
      document.cookie = `language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  const setIsRTL = (rtl: boolean) => {
    const newLang = rtl ? "ar" : "en";
    setLanguageState(newLang);
    setIsRTLState(rtl);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem("language", newLang);
      // Also set cookie for server components
      document.cookie = `language=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  return (
    <RTLContext.Provider value={{ isRTL, setIsRTL, language, setLanguage }}>
      {children}
    </RTLContext.Provider>
  );
}; 