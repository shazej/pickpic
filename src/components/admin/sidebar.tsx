"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    ShieldAlert,
    BarChart3,
    MessageSquareWarning,
    PackageSearch,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
    user: any;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
    const pathname = usePathname();

    const navItems = [
        {
            title: "Overview",
            href: "/admin",
            icon: LayoutDashboard,
        },
        {
            title: "Sellers",
            href: "/admin/sellers",
            icon: Users,
        },
        {
            title: "Moderation",
            icon: ShieldAlert,
            items: [
                {
                    title: "Products",
                    href: "/admin/moderation/products",
                    icon: PackageSearch,
                },
                {
                    title: "Messages",
                    href: "/admin/moderation/messages",
                    icon: MessageSquareWarning,
                },
            ],
        },
        {
            title: "Analytics",
            href: "/admin/analytics",
            icon: BarChart3,
        },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col h-full">
            <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
                <Link href="/admin" className="flex items-center gap-2 font-bold text-xl text-primary">
                    <span className="text-primary">Kechiki</span> Admin
                </Link>
            </div>

            <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                {navItems.map((item, index) => {
                    if (item.items) {
                        return (
                            <div key={index} className="pb-4">
                                <h4 className="mb-2 px-2 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                                    {item.title}
                                </h4>
                                <div className="space-y-1">
                                    {item.items.map((subItem) => (
                                        <NavItem
                                            key={subItem.href}
                                            item={subItem}
                                            pathname={pathname}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    }
                    return <NavItem key={item.href} item={item} pathname={pathname} />;
                })}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user?.name?.[0] || 'A'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate capitalize">{user?.roles?.[0] || 'Admin'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function NavItem({ item, pathname }: { item: any; pathname: string }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;

    return (
        <Link href={item.href}>
            <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                    "w-full justify-start gap-3 mb-1",
                    isActive && "bg-slate-100 dark:bg-slate-800 text-primary font-medium"
                )}
            >
                <Icon className="w-4 h-4" />
                {item.title}
            </Button>
        </Link>
    );
}
