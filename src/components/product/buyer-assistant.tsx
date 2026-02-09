
"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Loader2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Citation {
    type: 'attribute' | 'image' | 'policy';
    ref: string;
}

interface Message {
    id: string;
    role: "assistant" | "user";
    content: string;
    citations?: Citation[];
    suggested_questions?: string[];
    safety_notes?: string[];
}

export function BuyerAssistant({ productId }: { productId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) viewport.scrollTop = viewport.scrollHeight;
        }
    }, [messages, isLoading]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/ai/buyer-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    product_id: productId,
                    message: text,
                    thread_id: threadId
                })
            });

            const data = await res.json();
            if (res.ok) {
                setThreadId(data.thread_id);
                const assistantMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.reply,
                    citations: data.citations,
                    suggested_questions: data.suggested_questions,
                    safety_notes: data.safety_notes
                };
                setMessages(prev => [...prev, assistantMsg]);
            } else {
                throw new Error(data.error || "Failed to get reply");
            }
        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: "error",
                role: "assistant",
                content: "Sorry, I'm having trouble connecting right now. Please try again later."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 h-14 w-auto rounded-full shadow-2xl bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-all z-50 px-6 gap-2"
                >
                    <Sparkles className="w-5 h-5 text-purple-400" fill="currentColor" />
                    <span>Ask about this item</span>
                </Button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50 animate-in slide-in-from-bottom-5 duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-900">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">AI Assistant</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center py-8 px-4">
                                    <p className="text-sm text-slate-500 mb-4">I can help with details about this listing, sizing, condition, or shipping questions.</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {["Is this still available?", "What's the best price?", "Condition details?"].map(q => (
                                            <Badge
                                                key={q}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1"
                                                onClick={() => sendMessage(q)}
                                            >
                                                {q}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((m) => (
                                <div key={m.id} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                                    <div className={cn(
                                        "max-w-[85%] rounded-2xl p-3 text-sm",
                                        m.role === "user"
                                            ? "bg-slate-900 text-slate-100 rounded-tr-none"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700"
                                    )}>
                                        <p className="whitespace-pre-wrap">{m.content}</p>

                                        {/* Citations */}
                                        {m.citations && m.citations.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {m.citations.map((c, i) => (
                                                    <span key={i} className="text-[10px] bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                                                        <Info className="w-2 h-2" />
                                                        {c.ref}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Safety Notes */}
                                    {m.safety_notes && m.safety_notes.length > 0 && (
                                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-lg text-[11px] text-amber-700 dark:text-amber-400 w-[85%] flex gap-2">
                                            <AlertTriangle className="w-3 h-3 shrink-0" />
                                            <div>{m.safety_notes[0]}</div>
                                        </div>
                                    )}

                                    {/* Suggested Questions */}
                                    {m.suggested_questions && m.suggested_questions.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {m.suggested_questions.map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => sendMessage(q)}
                                                    className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 underline underline-offset-4"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-slate-200 dark:border-slate-700">
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                        <form
                            onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }}
                            className="flex gap-2"
                        >
                            <Input
                                placeholder="Type a message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="rounded-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            />
                            <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isLoading || !inputValue.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
