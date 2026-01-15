
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
        <div className={cn("flex w-full gap-4 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300", isUser ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
                "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full",
                isUser
                    ? "bg-muted"
                    : "bg-secondary"
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
                    "rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                    isUser
                        ? "bg-foreground/90 text-background rounded-tr-sm"
                        : "bg-transparent text-foreground rounded-tl-sm"
                )}>
                    {typeof content === 'string' ? <p className="whitespace-pre-wrap">{content}</p> : content}
                </div>
            </div>
        </div>
    );
}
