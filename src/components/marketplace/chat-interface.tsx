
"use client";

import { useState, useRef, useEffect } from "react";
import { MessageBubble } from "./message-bubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Image as ImageIcon, Loader2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HelpDialog } from "./help-dialog";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: React.ReactNode | string;
    attachments?: string[];
}

interface ChatInterfaceProps {
    initialMessage?: string;
}

export function ChatInterface({ initialMessage = "Snap a photo to buy or sell something!" }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: initialMessage }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pendingUpload, setPendingUpload] = useState<File | null>(null);
    const [pendingPreview, setPendingPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, pendingPreview]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPendingUpload(file);
            setPendingPreview(URL.createObjectURL(file));
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if ((!input.trim() && !pendingUpload) || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input || (pendingUpload ? "Uploaded an image" : ""),
            attachments: pendingPreview ? [pendingPreview] : undefined
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);
        const currentUpload = pendingUpload; // capture
        setPendingUpload(null);
        setPendingPreview(null);

        try {
            // Determine Intent
            // Default to 'search', but if user says "Sell this", switch
            const textLower = input.toLowerCase();
            const intent = textLower.includes('sell') ? 'list' : 'search';

            // Build Form Data
            const formData = new FormData();
            formData.append('intent', intent);
            if (currentUpload) {
                formData.append('image', currentUpload);
            }
            if (input) {
                formData.append('refinement', input); // Or 'description' for selling
            }

            // Reuse existing API
            // Note: If no image is provided, we might be refining the PREVIOUS image context.
            // For MVP simplicity, we only allow refinement if we store context or just assume user acts logically.
            // Let's assume for search refinement, we might need a way to pass "last image" context.
            // The API currently expects 'image'. If missing, it might fail for search unless we handle text-only search.
            // Let's rely on standard search helper if no image.

            const res = await fetch("/api/marketplace/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            // Construct Response
            if (intent === 'list' && data.success) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `Great! I've listed your item. ID: ${data.listingId}. You can verify it by searching for it.`
                }]);
            } else if (data.results) {
                // Show Results Carousel/Grid
                const resultsNode = (
                    <div className="space-y-2">
                        <p>I found these likely matches:</p>
                        <div className="grid grid-cols-2 gap-4">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {data.results.map((item: any) => (
                                <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.image_url} alt={item.title} className="aspect-square w-full object-cover" />
                                    <div className="p-2">
                                        <p className="font-bold text-sm truncate">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.currency || '$'}{item.price}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        {data.results.length === 0 && <p className="italic text-muted-foreground">No matches found.</p>}
                    </div>
                );

                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: resultsNode
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: "I couldn't process that. Please try uploading an image to search."
                }]);
            }

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Something went wrong. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // ... (previous imports)

    return (
        <div className="flex flex-col h-[85vh] max-w-3xl mx-auto w-full rounded-2xl overflow-hidden bg-background relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-card border-b border-border z-10 flex items-center justify-between px-6">
                <div className="w-10"></div>
                <h2 className="font-medium text-lg text-foreground">
                    Marketplace AI
                </h2>
                <div className="w-10 flex justify-end">
                    <HelpDialog />
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto pt-20 pb-32 px-6 space-y-6">
                {messages.map(m => (
                    <MessageBubble key={m.id} role={m.role} content={m.content} attachments={m.attachments} />
                ))}
                {isLoading && (
                    <div className="flex items-center gap-3 p-4">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"></span>
                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:150ms]"></span>
                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:300ms]"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Input Area */}
            <div className="absolute bottom-6 left-6 right-6 z-20">
                {/* Preview Pending Upload */}
                {pendingPreview && (
                    <div className="absolute -top-24 left-0 animate-in slide-in-from-bottom-5 fade-in duration-300">
                        <div className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={pendingPreview} alt="preview" className="h-20 w-20 object-cover rounded-xl border-2 border-primary shadow-sm" />
                            <button
                                onClick={() => { setPendingUpload(null); setPendingPreview(null); }}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-destructive/90 transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-card p-2 rounded-full border border-border shadow-sm flex items-center gap-2 pl-4 pr-2 max-w-2xl mx-auto">
                    <form onSubmit={handleSend} className="flex w-full items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImageIcon className="w-5 h-5" />
                            <span className="sr-only">Upload Image</span>
                        </Button>

                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={pendingUpload ? "Describe what you want to do..." : "Message Marketplace AI..."}
                            className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-[15px] h-10"
                            autoFocus
                        />

                        <Button
                            type="submit"
                            size="icon"
                            disabled={(!input && !pendingUpload) || isLoading}
                            className="h-10 w-10 rounded-full shrink-0"
                        >
                            <Send className="w-4 h-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
