
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Loader2, User, Bot, Sparkles, Plus, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { GenUiRenderer } from "./gen-ui-renderer";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { WelcomeGreeting } from "./welcome-greeting";
import { ActionChips } from "./action-chips";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    image?: string;
    type?: 'buyer_search' | 'seller_draft' | 'text' | 'error' | 'clarification' | 'gated_access';
    data?: any;
}

import { useLanguage } from "@/components/i18n/LanguageContext";

export function UnifiedChat() {
    const { t, detectAndSetLanguage, dir, language } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        // Initialize greeting only once or when language changes if empty or just greeting
        if (messages.length === 0) {
            setMessages([{
                id: "1",
                role: "assistant",
                content: t('chat.greeting')
            }]);
        }
    }, [t, messages.length]);

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) viewport.scrollTop = viewport.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const sendMessage = async (overrideContent?: string) => {
        const contentToSend = overrideContent || input;
        if ((!contentToSend.trim() && !selectedImage) || isLoading) return;

        // Detect language on first message (implied by contentToSend)
        detectAndSetLanguage(contentToSend);

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: contentToSend,
            image: selectedImage || undefined
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setSelectedImage(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: contentToSend,
                    image: userMsg.image,
                    history: messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
                    // Pass the current language from the hook (detectAndSetLanguage updates it)
                    language: language
                })
            });

            const data = await res.json();
            if (res.ok) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.reply,
                    type: data.type,
                    data: data.data
                }]);
            } else {
                const errorMsg = data.error || data.message || "Unknown error";
                if (errorMsg.includes("Insufficient credits")) {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: "assistant",
                        content: t('access.gated_msg'),
                        type: 'gated_access',
                        data: { reason: 'credits' }
                    }]);
                } else if (errorMsg.includes("Authentication required")) {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: "assistant",
                        content: t('access.gated_title'),
                        type: 'gated_access',
                        data: { reason: 'auth' }
                    }]);
                } else {
                    throw new Error(errorMsg);
                }
            }
        } catch (error: any) {
            // Only handle generic errors here now
            setMessages(prev => [...prev, {
                id: "error",
                role: "assistant",
                content: error.message || t('chat.error')
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = (action: string, payload: any) => {
        if (action === 'send_message') {
            sendMessage(payload);
        } else if (action === 'login') {
            window.location.href = '/login';
        } else if (action === 'buy_credits') {
            window.location.href = '/pricing';
        } else if (action === 'publish') {
            // Handle seller listing publication
            console.log('Publishing listing:', payload);
            // TODO: Send to backend API to create actual listing
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: language === 'ar'
                    ? "تم نشر إعلانك بنجاح! يمكنك رؤيته في صفحة منتجاتك."
                    : "Your listing has been published successfully! You can view it in your products page."
            }]);
        }
        console.log("Action triggered:", action, payload);
    };

    const showWelcome = messages.length <= 1;

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto w-full bg-background rounded-2xl overflow-hidden mt-4 relative">
            {/* Header / Language Toggle */}
            <div className="absolute top-4 right-4 z-10">
                <LanguageToggle />
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 px-8 pt-16 pb-6" ref={scrollRef}>
                <div className="space-y-6">
                    {showWelcome && <WelcomeGreeting userName="Shaz" />}
                    {messages.map((m) => (
                        <div key={m.id} className={cn("flex gap-4 animate-in fade-in slide-in-from-top-2 duration-500",
                            m.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}>
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                m.role === "user" ? "bg-muted" : "bg-secondary"
                            )}>
                                {m.role === "user" ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                            </div>
                            <div className={cn(
                                "flex flex-col gap-2 max-w-[80%]",
                                m.role === "user" ? "items-end" : "items-start"
                            )}>
                                {m.image && (
                                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md mb-2">
                                        <img src={m.image} alt="Uploaded" className="max-w-[300px] h-auto" />
                                    </div>
                                )}
                                <div className={cn(
                                    "px-4 py-3 rounded-2xl text-[15px] leading-relaxed",
                                    m.role === "user"
                                        ? "bg-foreground/90 text-background rounded-tr-sm"
                                        : "bg-transparent text-foreground rounded-tl-sm",
                                    dir === "rtl" && m.role === "user" && "rounded-tr-2xl rounded-tl-sm",
                                    dir === "rtl" && m.role === "assistant" && "rounded-tl-2xl rounded-tr-sm"
                                )}>
                                    {m.content}
                                </div>



                                {m.type && m.data && (
                                    <div className="w-full mt-2">
                                        <GenUiRenderer type={m.type} data={m.data} onAction={handleAction} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                <Bot className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-2 px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-6 pb-8">
                {selectedImage && (
                    <div className="mb-4 relative inline-block group">
                        <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-primary shadow-sm" />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {showWelcome && <ActionChips onAction={(prompt) => sendMessage(prompt)} />}

                <div className="flex items-center gap-3 bg-card p-2 rounded-full border border-border shadow-sm focus-within:shadow-md transition-shadow max-w-2xl mx-auto">
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent/50 shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Plus className="w-5 h-5" />
                    </Button>

                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={t('chat.placeholder')}
                        className="flex-1 border-none bg-transparent focus-visible:ring-0 shadow-none text-[15px] h-10"
                    />

                    <Button
                        onClick={() => sendMessage()}
                        disabled={isLoading || (!input.trim() && !selectedImage)}
                        size="icon"
                        className="rounded-full h-10 w-10 shrink-0"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function X({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    );
}
