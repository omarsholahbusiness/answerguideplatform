"use client";

import { useRTL } from "@/components/providers/rtl-provider";
import { translations, TranslationKey } from "@/lib/translations";

export const useTranslations = () => {
  const { language } = useRTL();
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };
  
  return { t, language };
};

