import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: '--font-body' });

export const metadata: Metadata = {
    title: "PickPic",
    description: "AI-Powered Marketplace",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} font-body antialiased`} suppressHydrationWarning>
                <LanguageProvider>
                    <AuthProvider>
                        {children}
                        <Toaster />
                    </AuthProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
