"use client";

import { useLanguage } from "./LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    const toggle = () => {
        setLanguage(language === "ar" ? "en" : "ar");
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className="flex items-center gap-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">
                {language === "ar" ? "English" : "العربية"}
            </span>
        </Button>
    );
}
