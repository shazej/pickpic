
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefinementChatProps {
    onRefine: (text: string) => void;
    isLoading: boolean;
    className?: string;
}

export function RefinementChat({ onRefine, isLoading, className }: RefinementChatProps) {
    const [input, setInput] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onRefine(input);
        setInput("");
    };

    return (
        <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2", className)}>
            {isOpen && (
                <div className="bg-background border rounded-lg shadow-xl w-80 p-4 mb-2 animate-in slide-in-from-bottom-5 fade-in">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Refine Results
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                        Ask for changes like "Cheaper", "Closer to me", or "Red ones only".
                    </p>
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Make it cheaper..."
                            className="h-9"
                            disabled={isLoading}
                        />
                        <Button type="submit" size="sm" disabled={isLoading}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            )}

            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg"
            >
                {isOpen ? "X" : <Sparkles className="w-6 h-6" />}
            </Button>
        </div>
    );
}
