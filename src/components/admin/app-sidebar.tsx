
"use client"

import * as React from "react"
import {
    SquareTerminal,
    Users,
    Store,
    LayoutGrid,
    ShieldAlert,
    Settings,
    FileText,
    LifeBuoy,
    CreditCard,
    BarChart,
    Bot
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Menu definition
const data = {
    navMain: [
        {
            title: "Overview",
            url: "/super-admin",
            icon: SquareTerminal,
            isActive: true,
        },
        {
            title: "User Management",
            icon: Users,
            items: [
                { title: "Users", url: "/super-admin/users" },
                { title: "Sellers", url: "/super-admin/sellers" },
            ],
        },
        {
            title: "Marketplace",
            icon: Store,
            items: [
                { title: "Listings", url: "/super-admin/listings" },
                { title: "Reviews", url: "/super-admin/reviews" },
                { title: "Chats", url: "/super-admin/chats" },
            ],
        },
        {
            title: "Content & CMS",
            icon: FileText,
            items: [
                { title: "Media", url: "/super-admin/media" },
                { title: "FAQ", url: "/super-admin/content/faq" },
                { title: "Tutorials", url: "/super-admin/content/tutorial" },
            ],
        },
        {
            title: "Moderation",
            icon: ShieldAlert,
            items: [
                { title: "Reports", url: "/super-admin/reports" },
                { title: "Audit Logs", url: "/super-admin/audit-logs" },
            ],
        },
        {
            title: "Support",
            icon: LifeBuoy,
            url: "/super-admin/support",
        },
        {
            title: "Finance",
            icon: CreditCard,
            items: [
                { title: "Billing", url: "/super-admin/billing" },
                { title: "Subscriptions", url: "/super-admin/subscriptions" },
                { title: "Plans", url: "/super-admin/plans" },
            ],
        },
        {
            title: "AI & Tech",
            icon: Bot,
            items: [
                { title: "AI Usage", url: "/super-admin/ai/usage" },
                { title: "Prompts", url: "/super-admin/ai/prompts" },
                { title: "System Health", url: "/super-admin/system" },
            ],
        },
        {
            title: "Settings",
            icon: Settings,
            items: [
                { title: "General", url: "/super-admin/settings" },
                { title: "Security", url: "/super-admin/security" },
                { title: "Localization", url: "/super-admin/localization" },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/super-admin">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <LayoutGrid className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">kechiki Admin</span>
                                    <span className="truncate text-xs">Super Admin Panel</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {/* Main Nav */}
                <SidebarGroup>
                    <SidebarMenu>
                        {data.navMain.map((item) => {
                            const isActive = pathname === item.url || (item.items && item.items.some(sub => pathname.startsWith(sub.url)));

                            if (!item.items) {
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            }

                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                                    <Link href={subItem.url}>
                                                        <span>{subItem.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <div className="p-4 text-xs text-muted-foreground">
                    v1.0.0
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
