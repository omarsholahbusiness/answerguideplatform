"use client";

import { useEffect, useState } from "react";

interface LocaleHTMLProps {
  locale?: string;
}

export const LocaleHTML = ({ locale }: LocaleHTMLProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined" || typeof window === "undefined") return;
    
    try {
      const isRTL = locale === 'ar';
      const lang = locale || 'ar';
      
      // Update HTML attributes when locale changes
      if (document.documentElement) {
        document.documentElement.dir = isRTL ? "rtl" : "ltr";
        document.documentElement.lang = lang;
      }
      
      // Update body font class based on language
      if (document.body) {
        if (lang === "ar") {
          document.body.classList.add("font-playpen-sans-arabic");
          document.body.classList.remove("font-sans");
        } else {
          document.body.classList.add("font-sans");
          document.body.classList.remove("font-playpen-sans-arabic");
        }
      }
    } catch (error) {
      console.error("Error updating HTML direction:", error);
    }
  }, [locale, mounted]);

  return null;
};

