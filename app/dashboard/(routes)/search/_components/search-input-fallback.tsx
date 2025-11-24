"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRTL } from "@/components/providers/rtl-provider";
import { useTranslations } from "@/lib/use-translations";

export const SearchInputFallback = () => {
    const { isRTL } = useRTL();
    const { t } = useTranslations();

    return (
        <div className="flex items-center gap-x-3 w-full max-w-2xl">
            <div className="relative flex-1">
                <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                <Input
                    placeholder={t("searchPlaceholder")}
                    className={`h-12 text-base border-2 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                    disabled
                />
            </div>
            <Button 
                className="h-12 px-6 bg-[#005bd3] hover:bg-[#005bd3]/90 text-white font-semibold"
                disabled
            >
                <Search className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t("searchButton")}
            </Button>
        </div>
    );
};

