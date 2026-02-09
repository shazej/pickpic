"use client";

import { Button } from "@/components/ui/button";
import { Camera, ShoppingBag, Tag, Search } from "lucide-react";

interface ActionChipsProps {
    onAction: (prompt: string) => void;
}

export function ActionChips({ onAction }: ActionChipsProps) {
    const chips = [
        { icon: Camera, label: "Find similar items", prompt: "I want to find products similar to this" },
        { icon: ShoppingBag, label: "Browse products", prompt: "Show me what's available" },
        { icon: Tag, label: "Sell something", prompt: "I want to sell something" },
        { icon: Search, label: "Search by image", prompt: "Help me search using a photo" },
    ];

    return (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 mb-2">
            {chips.map((chip) => (
                <Button
                    key={chip.label}
                    variant="ghost"
                    onClick={() => onAction(chip.prompt)}
                    className="rounded-full bg-secondary hover:bg-border text-sm font-normal h-10 px-5 transition-colors"
                >
                    <chip.icon className="w-4 h-4 mr-2" />
                    {chip.label}
                </Button>
            ))}
        </div>
    );
}
