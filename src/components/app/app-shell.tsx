"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAppState } from "@/context/app-state-context"
import { cn } from "@/lib/utils"
// Assuming shadcn components exist or using standard HTMLElements with tailwind
import { Button } from "@/components/ui/button"
import { Home, Search, MessageSquare, User, PlusCircle, Store } from "lucide-react"


export function AppShell({ children }: { children: React.ReactNode }) {
    const { mode, setMode } = useAppState()

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between px-4 max-w-md mx-auto md:max-w-4xl">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <span className="text-primary">kechiki</span>
                    </div>

                    {/* Mode Toggle */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="flex items-center rounded-full bg-slate-100 p-1 dark:bg-slate-800 border">
                            <button
                                onClick={() => setMode("buyer")}
                                className={cn(
                                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                                    mode === "buyer"
                                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-50"
                                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                                )}
                            >
                                Buyer
                            </button>
                            <button
                                onClick={() => setMode("seller")}
                                className={cn(
                                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                                    mode === "seller"
                                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-50"
                                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                                )}
                            >
                                Seller
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">

                        <Button variant="ghost" size="icon" className="rounded-full">
                            <User className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 container px-4 py-6 max-w-md mx-auto md:max-w-4xl pb-24 md:pb-6">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 block border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
                <div className="grid h-16 grid-cols-4 items-center justify-center">
                    {mode === "buyer" ? (
                        <>
                            <BottomNavItem icon={Search} label="Search" isActive={true} />
                            <BottomNavItem icon={MessageSquare} label="Chats" />
                            <BottomNavItem icon={User} label="Profile" />
                        </>
                    ) : (
                        <>
                            <BottomNavItem icon={Store} label="My Store" isActive={true} />
                            <BottomNavItem icon={PlusCircle} label="Sell" />
                            <BottomNavItem icon={MessageSquare} label="Chats" />
                            <BottomNavItem icon={User} label="Profile" />
                        </>
                    )}
                </div>
            </nav>
        </div>
    )
}

function BottomNavItem({ icon: Icon, label, isActive }: { icon: any, label: string, isActive?: boolean }) {
    return (
        <button className={cn(
            "flex flex-col items-center justify-center gap-1 h-full w-full",
            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}>
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    )
}
