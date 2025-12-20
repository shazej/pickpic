
"use client";

import { cn } from "@/lib/utils";
import { User, Sparkles } from "lucide-react";

interface MessageBubbleProps {
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
    attachments?: string[]; // URLs (images)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MessageBubble({ role, content, attachments }: MessageBubbleProps) {
    const isUser = role === 'user';

    return (
        <div className={cn("flex w-full gap-4 p-4 animate-in slide-in-from-bottom-2 duration-500", isUser ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
                "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full border shadow-sm transition-transform hover:scale-105",
                isUser
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent"
                    : "bg-white text-indigo-600 border-indigo-100 ring-2 ring-indigo-50"
            )}>
                {isUser ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>

            <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser ? "items-end" : "items-start")}>
                {/* Attachments (Images user uploaded) */}
                {attachments && attachments.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-2">
                        {attachments.map((src, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={src} alt="attachment" className="h-40 w-40 object-cover rounded-xl border-2 border-white shadow-md hover:scale-105 transition-transform cursor-pointer" />
                        ))}
                    </div>
                )}

                <div className={cn(
                    "rounded-2xl px-6 py-4 shadow-sm text-sm leading-relaxed",
                    isUser
                        ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-sm"
                        : "bg-white/80 backdrop-blur-md border border-white/40 text-slate-800 rounded-tl-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                )}>
                    {typeof content === 'string' ? <p className="whitespace-pre-wrap">{content}</p> : content}
                </div>
            </div>
        </div>
    );
}
