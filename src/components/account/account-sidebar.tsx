
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CreditCard, MessageSquare, Shield, Activity } from "lucide-react";

const NAV_ITEMS = [
    { label: "Profile", href: "/account", icon: User },
    { label: "Billing", href: "/account/billing", icon: CreditCard },
    { label: "Messages", href: "/account/messages", icon: MessageSquare }, // Note: updating this from /messages to consolidate
    { label: "Security", href: "/account/security", icon: Shield },
];

export function AccountSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-full md:w-64 space-y-2">
            <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                    Settings
                </h2>
                <div className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent ${isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"}`}>
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
