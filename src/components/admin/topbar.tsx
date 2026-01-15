"use client";

import { usePathname } from "next/navigation";
import { UserNav } from "@/components/layout/user-nav";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface AdminTopbarProps {
    user: any;
}

export function AdminTopbar({ user }: AdminTopbarProps) {
    const pathname = usePathname();

    // Simple breadcrumb logic
    const segments = pathname.split('/').filter(Boolean);
    const title = segments.length > 1
        ? segments[segments.length - 1].charAt(0).toUpperCase() + segments[segments.length - 1].slice(1)
        : "Dashboard";

    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 capitalize">
                    {title.replace(/-/g, ' ')}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Language Toggle Placeholder */}
                <Button variant="outline" size="sm">AR/EN</Button>
                <UserNav user={user} />
            </div>
        </header>
    );
}
