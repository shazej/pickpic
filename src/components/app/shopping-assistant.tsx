"use client"

import React from "react"
import { Sparkles, Send, Mic, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
// Using Next/Image or img tag. Assuming shadcn/ui components available.

// Types
interface Message {
    id: string
    role: "assistant" | "user"
    content: string
    type: "text" | "product-carousel" | "chips"
    data?: any
}

interface Product {
    id: string
    title: string
    category: string
    price: string
    image: string
}

const DEMO_PRODUCTS: Product[] = [
    {
        id: "1",
        title: "Silk green dress",
        category: "for women",
        price: "$79.90",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=200&auto=format&fit=crop"
    },
    {
        id: "2",
        title: "Flower pattern dress",
        category: "for women",
        price: "$80.00",
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=200&auto=format&fit=crop"
    },
    {
        id: "3",
        title: "Silk maxi dress",
        category: "for women",
        price: "$90.99",
        image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=200&auto=format&fit=crop"
    }
]

const DEMO_CHIPS = ["Outerwear", "Tops", "Shorts", "Trouser", "Accessories"]

export function ShoppingAssistant() {
    const [inputValue, setInputValue] = React.useState("")

    // Initial State matching the design
    const [messages, setMessages] = React.useState<Message[]>([
        {
            id: "1",
            role: "user",
            type: "text",
            content: "I'm looking for a new dress for a summer wedding. Can you help?"
        },
        {
            id: "2",
            role: "assistant",
            type: "text",
            content: "Here are some dresses that I recommend to for you."
        },
        {
            id: "3",
            role: "assistant",
            type: "product-carousel",
            content: "",
            data: DEMO_PRODUCTS
        },
        {
            id: "4",
            role: "assistant",
            type: "text",
            content: "Would you like to receive recommendations for other products?"
        },
        {
            id: "5",
            role: "assistant",
            type: "chips",
            content: "",
            data: DEMO_CHIPS
        }
    ])

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 dark:bg-slate-900">

            {/* Header - Already part of AppShell, but we can add a sub-header if needed. 
          The design shows "Shopping Assistant" at the top. 
          We'll assume the AppShell header handles the main branding, 
          but we can put a title here if we want strictly to match. 
      */}
            <div className="text-center py-4 bg-white dark:bg-slate-950 sticky top-0 z-10 shadow-sm border-b border-slate-100 dark:border-slate-800">
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Shopping Assistant</h1>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn("flex max-w-[85%] md:max-w-[70%]", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>

                            {/* Avatar Icon for Assistant */}
                            {msg.role === "assistant" && (
                                <div className="flex-shrink-0 w-8 h-8 mr-3 rounded-full bg-slate-900 text-white flex items-center justify-center mt-1">
                                    <Sparkles className="w-4 h-4 text-purple-200" fill="currentColor" />
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                {/* Text Bubble */}
                                {msg.type === "text" && (
                                    <div
                                        className={cn(
                                            "px-5 py-3 rounded-2xl text-sm md:text-base leading-relaxed animate-in zoom-in-95 duration-300",
                                            msg.role === "user"
                                                ? "bg-[#D8D4FF] text-slate-900 rounded-tr-sm" // User Bubble Color (Light Purple)
                                                : "bg-[#F0F2F5] text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-tl-sm" // Assistant Bubble Color (Gray)
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                )}

                                {/* Product Carousel */}
                                {msg.type === "product-carousel" && (
                                    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-hide -ml-11 md:ml-0 pl-11 md:pl-0 w-[calc(100vw-32px)] md:w-full">
                                        {/* Negative margin hack for mobile full-width swipe while keeping avatar alignment conceptually */}
                                        {msg.data.map((product: Product) => (
                                            <div key={product.id} className="snap-center shrink-0 w-[160px] bg-white dark:bg-slate-950 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                                                <div className="h-[180px] w-full bg-slate-200 relative">
                                                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="p-3">
                                                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{product.title}</h3>
                                                    <p className="text-xs text-slate-500 mb-2 truncate">{product.category}</p>
                                                    <p className="font-bold text-slate-900 dark:text-slate-100">{product.price}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Suggestion Chips */}
                                {msg.type === "chips" && (
                                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        {msg.data.map((chip: string) => (
                                            <button key={chip} className="px-4 py-1.5 rounded-full border border-slate-300 text-slate-600 text-sm font-medium bg-white hover:bg-slate-50 transition-colors dark:bg-slate-950 dark:border-slate-700 dark:text-slate-300">
                                                {chip}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 sticky bottom-14 md:bottom-0">
                {/* Bottom-14 to account for mobile nav */}
                <div className="relative flex items-center bg-slate-100 dark:bg-slate-900 rounded-full px-4 py-2 border border-transparent focus-within:border-primary/20 transition-all">
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                        <Camera className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        placeholder="Ask anything..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 px-2 outline-none text-sm placeholder:text-slate-400"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                        <Mic className="w-5 h-5" />
                    </button>
                    {inputValue && (
                        <button className="p-2 ml-1 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity">
                            <Send className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

        </div>
    )
}
