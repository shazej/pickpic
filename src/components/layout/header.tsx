
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Camera, Search, User, LogOut } from "lucide-react";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useState } from "react";

export function Header() {
    const { user, signOut } = useAuth();
    const { t } = useLanguage();
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">

                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="font-bold text-xl flex items-center gap-2">
                        <Camera className="h-6 w-6 text-primary" />
                        <span className="hidden sm:inline-block">sale chat</span>
                    </Link>
                </div>

                {/* Desktop Nav - Mode Toggle */}
                <div className="hidden md:flex flex-1 justify-center">
                    <Tabs
                        value={pathname?.startsWith('/sell') ? 'sell' : 'shop'}
                        onValueChange={(v) => router.push(v === 'sell' ? '/sell' : '/')}
                        className="w-[200px]"
                    >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="shop">{t("nav.shop")}</TabsTrigger>
                            <TabsTrigger value="sell">{t("nav.sell")}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Desktop Nav - Links */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/tutorial" className={`group relative py-2 transition-colors hover:text-foreground ${pathname === '/tutorial' ? 'text-foreground' : 'text-foreground/60'}`}>
                        {t("nav.how_it_works")}
                        {pathname === '/tutorial' && (
                            <span className="absolute bottom-0 start-0 h-[2px] w-full bg-primary rounded-full" />
                        )}
                    </Link>
                    <Link href="/support" className={`group relative py-2 transition-colors hover:text-foreground ${pathname === '/support' ? 'text-foreground' : 'text-foreground/60'}`}>
                        {t("nav.support")}
                        {pathname === '/support' && (
                            <span className="absolute bottom-0 start-0 h-[2px] w-full bg-primary rounded-full" />
                        )}
                    </Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <LanguageToggle />
                    {/* Visual Search CTA (Mobile/Desktop) */}
                    <Link href="/search?mode=visual">
                        <Button variant="ghost" size="icon" title="Visual Search">
                            <Camera className="h-5 w-5" />
                            <span className="sr-only">Visual Search</span>
                        </Button>
                    </Link>

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="" alt={user.name || "User"} />
                                        <AvatarFallback>{user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/account">Account Settings</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/account/billing">Billing</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/account/messages">Messages</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => signOut()}>
                                    <LogOut className="me-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Log in</Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm">Sign up</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
