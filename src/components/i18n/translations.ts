export type Language = "en" | "ar";

export const translations: Record<Language, Record<string, string>> = {
    en: {
        "nav.home": "Home",
        "nav.search": "Search",
        "nav.settings": "Settings",
        "welcome": "Welcome to StudioXO",
        "login": "Login",
        "logout": "Logout",
    },
    ar: {
        "nav.home": "الرئيسية",
        "nav.search": "بحث",
        "nav.settings": "الإعدادات",
        "welcome": "موهبة StudioXO",
        "login": "تسجيل الدخول",
        "logout": "تسجيل الخروج",
    },
};
