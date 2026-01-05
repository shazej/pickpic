
"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Search, DollarSign, MessageSquare } from "lucide-react";

export function HelpDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50">
                    <HelpCircle className="h-5 w-5" />
                    <span className="sr-only">Help</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        How to use sale chat
                    </DialogTitle>
                    <DialogDescription>
                        Your AI-powered visual marketplace assistant.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                            <Search className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800">Visual Search</h4>
                            <p className="text-sm text-slate-500">Upload a photo to find similar items instantly. No keywords needed.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800">Refine with Chat</h4>
                            <p className="text-sm text-slate-500">Too expensive? Wrong color? Just tell the AI: "Find cheaper ones" or "Show me red".</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800">Sell in Seconds</h4>
                            <p className="text-sm text-slate-500">Upload an item and say "Sell this". The AI generates the listing for you.</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
