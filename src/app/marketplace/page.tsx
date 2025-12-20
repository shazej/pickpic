
"use client";

import { ChatInterface } from "@/components/marketplace/chat-interface";
import { Sparkles } from "lucide-react";

export default function MarketplacePage() {
    return (
        <div className="container mx-auto py-8 px-4 min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50">
            {/* Minimal Header */}
            <div className="text-center space-y-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
                    PickPic
                </h1>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <p className="text-sm font-medium">Image-First AI Marketplace</p>
                </div>
            </div>

            <ChatInterface />

            <footer className="text-xs text-muted-foreground/60 mt-8 font-medium tracking-wide">
                Powered by GenKit • Pure Visual Search
            </footer>
        </div>
    );
}
