"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRTL } from "@/components/providers/rtl-provider";
import { useTranslations } from "@/lib/use-translations";

export const SearchInput = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isRTL } = useRTL();
    const { t } = useTranslations();

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;

        if (title) {
            router.push(`/dashboard/search?title=${title}`);
        } else {
            router.push("/dashboard/search");
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex items-center gap-x-3 w-full max-w-2xl">
            <div className="relative flex-1">
                <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                <Input
                    name="title"
                    placeholder={t("searchPlaceholder")}
                    defaultValue={searchParams.get("title") || ""}
                    className={`h-12 text-base border-2 focus:border-[#005bd3] transition-colors ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                />
            </div>
            <Button 
                type="submit" 
                className="h-12 px-6 bg-[#005bd3] hover:bg-[#005bd3]/90 text-white font-semibold transition-all duration-200 hover:scale-105"
            >
                <Search className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t("searchButton")}
            </Button>
        </form>
    );
}; 