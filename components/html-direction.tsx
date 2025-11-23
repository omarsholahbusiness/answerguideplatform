"use client";

import { useEffect, useState } from "react";
import { useRTL } from "@/components/providers/rtl-provider";

export const HtmlDirection = () => {
  const [mounted, setMounted] = useState(false);
  const { isRTL, language } = useRTL();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined" || typeof window === "undefined") return;
    
    try {
      // Update HTML attributes when language/direction changes
      if (document.documentElement) {
        document.documentElement.dir = isRTL ? "rtl" : "ltr";
        document.documentElement.lang = language;
      }
      
      // Update body font class based on language
      if (document.body) {
        if (language === "ar") {
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
  }, [isRTL, language, mounted]);

  return null;
};

