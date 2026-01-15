import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { CartProvider } from "@/context/cart-context";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: '--font-body' });

export const metadata: Metadata = {
    title: "kechiki",
    description: "AI-Powered Marketplace",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ar" dir="rtl" suppressHydrationWarning>
            <body className={`${inter.variable} font-body antialiased`} suppressHydrationWarning>
                <LanguageProvider>
                    <AuthProvider>
                        <CartProvider>
                            {children}
                            <Toaster />
                        </CartProvider>
                    </AuthProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
