
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X, ImageIcon, User, Bot } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    image?: string;
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', text: 'Hi! I can help you find products or answer questions about items.' }
    ]);
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: inputValue };
        setMessages(prev => [...prev, newUserMsg]);
        setInputValue("");

        // Mock Response
        setTimeout(() => {
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: "I'm looking into that for you. (Mock AI Response)" };
            setMessages(prev => [...prev, aiMsg]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4">
            {isOpen && (
                <Card className="w-[350px] h-[500px] flex flex-col shadow-lg border-border">
                    <div className="p-3 border-b bg-card flex justify-between items-center rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            <span className="font-medium">kechiki Assistant</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={cn("flex gap-2", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-muted" : "bg-secondary")}>
                                        {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                                    </div>
                                    <div className={cn("rounded-xl px-3 py-2 text-sm max-w-[80%]", msg.role === 'user' ? "bg-foreground/90 text-background" : "bg-transparent text-foreground")}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-3 border-t bg-background rounded-b-lg">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                            <Input
                                placeholder="Ask anything..."
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" size="icon" className="shrink-0 rounded-full">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </Card>
            )}

            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg" onClick={() => setIsOpen(!isOpen)}>
                <MessageSquare className="h-7 w-7" />
            </Button>
        </div>
    );
}
