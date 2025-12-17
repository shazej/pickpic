"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "./LanguageContext";
import { Globe } from "lucide-react";

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            title={language === "en" ? "Switch to Arabic" : "Switch to English"}
        >
            <Globe className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
            <span className="sr-only">Toggle language</span>
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold">
                {language.toUpperCase()}
            </span>
        </Button>
    );
}
