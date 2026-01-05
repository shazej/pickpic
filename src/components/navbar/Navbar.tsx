"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Camera, LogOut, MessageCircle, LifeBuoy, BookOpen, HelpCircle, Store } from "lucide-react";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TutorialPopup } from "@/components/tutorial/TutorialPopup";

export function Navbar() {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { href: "/", label: "Home", exact: true },
        { href: "/search", label: "Search" },
        { href: "/tutorial", label: "Tutorial", icon: BookOpen },
        { href: "/faq", label: "FAQ", icon: HelpCircle },
        { href: "/support", label: "Support", icon: LifeBuoy },
    ];

    // Conditional links
    if (user) {
        navLinks.push({ href: "/messages", label: "Messages", icon: MessageCircle });
    }

    const isActive = (path: string, exact = false) => {
        if (exact) return pathname === path;
        return pathname?.startsWith(path);
    };

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full border-b transition-all duration-200",
            isScrolled ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" : "bg-background"
        )}>
            <div className="container flex h-16 items-center justify-between">

                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="font-bold text-xl flex items-center gap-2">
                        <Camera className="h-6 w-6 text-primary" />
                        <span className="hidden sm:inline-block">sale chat</span>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link
                        href="/"
                        className={cn(
                            "group relative py-2 transition-colors hover:text-foreground flex items-center gap-2",
                            isActive("/", true) ? "text-foreground" : "text-foreground/60"
                        )}
                    >
                        <MessageCircle className="h-4 w-4" />
                        Chat
                        {isActive("/", true) && (
                            <span className="absolute bottom-0 start-0 h-[2px] w-full bg-primary rounded-full" />
                        )}
                    </Link>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTutorial(true)}
                        className="text-foreground/60 hover:text-foreground gap-2"
                    >
                        <BookOpen className="h-4 w-4" />
                        Tutorial
                    </Button>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block">
                        <LanguageToggle />
                    </div>

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9 border">
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
                                    <Link href="/account">Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/account/billing">Billing</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/messages">Messages</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => signOut()}>
                                    <LogOut className="me-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="hidden md:flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Log in</Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm">Sign up</Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Drawer */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <SheetHeader>
                                <SheetTitle className="text-left flex items-center gap-2">
                                    <Camera className="h-5 w-5 text-primary" />
                                    Menu
                                </SheetTitle>
                            </SheetHeader>
                            <div className="grid gap-4 py-4">
                                <div className="flex flex-col gap-2">
                                    {navLinks.map((link) => (
                                        <SheetClose key={link.href} asChild>
                                            <Link
                                                href={link.href}
                                                className={cn(
                                                    "flex items-center gap-2 px-2 py-3 text-lg font-medium rounded-md hover:bg-muted",
                                                    isActive(link.href, link.exact) ? "bg-muted text-primary" : "text-foreground/80"
                                                )}
                                            >
                                                {link.icon && <link.icon className="h-5 w-5" />}
                                                {link.label}
                                            </Link>
                                        </SheetClose>
                                    ))}
                                    <SheetClose asChild>
                                        <Link
                                            href={user ? "/sell" : "/login?redirect=/sell/new"}
                                            className={cn(
                                                "flex items-center gap-2 px-2 py-3 text-lg font-medium rounded-md hover:bg-muted",
                                                isActive("/sell") ? "bg-muted text-primary" : "text-foreground/80"
                                            )}
                                        >
                                            <Store className="h-5 w-5" />
                                            Sell
                                        </Link>
                                    </SheetClose>

                                    <SheetClose asChild>
                                        <button
                                            onClick={() => setShowTutorial(true)}
                                            className="flex items-center gap-2 px-2 py-3 text-lg font-medium rounded-md hover:bg-muted w-full text-left text-foreground/80"
                                        >
                                            <BookOpen className="h-5 w-5" />
                                            Show Tutorial
                                        </button>
                                    </SheetClose>
                                </div>
                                <div className="h-px bg-border my-2" />

                                {!user && (
                                    <div className="flex flex-col gap-2">
                                        <SheetClose asChild>
                                            <Link href="/login">
                                                <Button className="w-full" variant="outline">Log in</Button>
                                            </Link>
                                        </SheetClose>
                                        <SheetClose asChild>
                                            <Link href="/register">
                                                <Button className="w-full">Sign up</Button>
                                            </Link>
                                        </SheetClose>
                                    </div>
                                )}

                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Language</span>
                                    <LanguageToggle />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <TutorialPopup
                onClose={() => setShowTutorial(false)}
                forceShow={showTutorial}
            />
        </header >
    );
}
