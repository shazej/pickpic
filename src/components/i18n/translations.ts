export type Language = "en" | "ar";

export const translations: Record<Language, Record<string, string>> = {
    en: {
        "nav.home": "Home",
        "nav.search": "Search",
        "nav.shop": "Shop",
        "nav.sell": "Sell",
        "nav.how_it_works": "How it Works",
        "nav.support": "Support",
        "nav.settings": "Settings",
        "welcome": "Welcome to sale chat",
        "login": "Login",
        "logout": "Logout",
    },
    ar: {
        "nav.home": "الرئيسية",
        "nav.search": "بحث",
        "nav.shop": "تسوق",
        "nav.sell": "بيع",
        "nav.how_it_works": "كيف يعمل",
        "nav.support": "الدعم",
        "nav.settings": "الإعدادات",
        "welcome": "موهبة sale chat",
        "login": "تسجيل الدخول",
        "logout": "تسجيل الخروج",
    },
};
