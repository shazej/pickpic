"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language } from "./translations";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    dir: "ltr" | "rtl";
    detectAndSetLanguage: (text: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Default to Arabic
    const [language, setLanguage] = useState<Language>("ar");
    const [hasUserSetPreference, setHasUserSetPreference] = useState(false);

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    const dir = language === "ar" ? "rtl" : "ltr";

    // Persist language preference
    useEffect(() => {
        const saved = localStorage.getItem("language") as Language;
        if (saved && (saved === "en" || saved === "ar")) {
            setLanguage(saved);
            setHasUserSetPreference(true);
        } else {
            // Ensure default is applied to DOM if no saved preference
            document.documentElement.dir = "rtl";
            document.documentElement.lang = "ar";
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        setHasUserSetPreference(true);
        localStorage.setItem("language", lang);
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = lang;
    };

    const detectAndSetLanguage = (text: string) => {
        if (hasUserSetPreference) return;

        // Simple check: if text contains Arabic characters, switch to AR, else EN
        const arabicPattern = /[\u0600-\u06FF]/;
        const isArabic = arabicPattern.test(text);

        // If detected matches current, do nothing. If different, switch but DON'T persist as user preference yet?
        // Requirement: "Detect language on the first user message (ar/en) and persist it"
        // Let's persist it if it's the first detection.

        const detectedLang = isArabic ? "ar" : "en";

        // Only switch if we haven't set a preference yet. 
        // Note: The prompt says "Detect language on the first user message... and persist it".
        // So we treat this detection as setting the preference.

        handleSetLanguage(detectedLang);
    };

    // Sync dir on mount and change
    useEffect(() => {
        document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = language;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, dir, detectAndSetLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
