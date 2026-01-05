
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Loader2, User, Bot, Sparkles, Plus, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    image?: string;
    products?: any[];
}

export function UnifiedChat() {
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", role: "assistant", content: "👋 Hi! I'm your sale chat Assistant. I can help you find products using images, or help you create a listing if you're selling something. How can I assist you today?" }
    ]);
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

    const sendMessage = async () => {
        if ((!input.trim() && !selectedImage) || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
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
                    message: input,
                    image: userMsg.image,
                    history: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
                })
            });

            const data = await res.json();
            if (res.ok) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.reply,
                    products: data.matched_products
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                id: "error",
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto w-full bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mt-4">
            {/* Chat Area */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="space-y-6">
                    {messages.map((m) => (
                        <div key={m.id} className={cn("flex gap-4", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                                m.role === "user" ? "bg-slate-900 border-slate-700" : "bg-purple-500 border-purple-400"
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
                                    "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                                    m.role === "user"
                                        ? "bg-slate-900 text-slate-100 rounded-tr-none"
                                        : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-800"
                                )}>
                                    {m.content}
                                </div>

                                {m.products && m.products.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 w-full">
                                        {m.products.map((p: any) => (
                                            <div key={p.product_id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <ImageIcon className="w-8 h-8 opacity-20" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="font-semibold text-sm truncate text-slate-900 dark:text-slate-100">{p.title}</h4>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-primary font-bold text-xs">{p.price} {p.currency || 'USD'}</span>
                                                    </div>

                                                    <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <User className="w-3 h-3 text-slate-400" />
                                                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{p.seller_name || 'Generic Seller'}</span>
                                                        </div>
                                                        {p.seller_phone && (
                                                            <a href={`tel:${p.seller_phone}`} className="flex items-center gap-2 text-primary hover:underline transition-all">
                                                                <Phone className="w-3 h-3" />
                                                                <span className="text-[10px] font-bold">{p.seller_phone}</span>
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2 mt-3">
                                                        <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] px-2 bg-slate-900 text-white hover:bg-slate-800 border-none" onClick={() => window.open(`/p/${p.product_id}`, '_blank')}>
                                                            View Details
                                                        </Button>
                                                        {p.seller_phone && (
                                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                                                                <a href={`tel:${p.seller_phone}`}>
                                                                    <Phone className="w-3 h-3" />
                                                                </a>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center animate-bounce">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3 border border-slate-200/50 dark:border-slate-800/50">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse delay-75" />
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse delay-150" />
                                </div>
                                <span className="text-xs font-medium text-slate-500">PickPic is analyzing...</span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                {selectedImage && (
                    <div className="mb-4 relative inline-block group">
                        <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-primary" />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-4 bg-white dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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
                        className="rounded-xl h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Plus className="w-5 h-5" />
                    </Button>

                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Describe what you want to find or sell..."
                        className="flex-1 border-none bg-transparent focus-visible:ring-0 text-base"
                    />

                    <Button
                        onClick={sendMessage}
                        disabled={isLoading || (!input.trim() && !selectedImage)}
                        className="rounded-xl h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white gap-2 transition-all active:scale-95"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline font-medium">Send</span>
                    </Button>
                </div>
                <p className="text-[10px] text-center mt-3 text-slate-400 font-medium">
                    ✨ Powered by sale chat Visual Intelligence • Gemini 1.5 Flash
                </p>
            </div>
        </div>
    );
}

function X({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    );
}
