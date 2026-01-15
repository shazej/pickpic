"use client";

import { useLanguage } from "@/components/i18n/LanguageContext";

interface WelcomeGreetingProps {
    userName?: string;
}

export function WelcomeGreeting({ userName }: WelcomeGreetingProps) {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            <h1 className="text-3xl md:text-4xl font-normal text-foreground mb-2">
                {userName ? `${t('chat.hi')} ${userName}` : t('chat.hello')}
            </h1>
            <p className="text-lg md:text-xl font-light text-muted-foreground">
                What would you like to buy or sell today?
            </p>
        </div>
    );
}
