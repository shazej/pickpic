
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { UsageSummary } from "@/components/account/usage-summary";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, CreditCard, MessageSquare, ShoppingBag } from "lucide-react";
import { ConnectedAccounts } from "@/components/account/connected-accounts";

export default function AccountPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/user/profile');
                const data = await res.json();
                if (data.user) {
                    setName(data.user.display_name || "");
                    setEmail(data.user.email);
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                toast({ title: "Profile updated successfully" });
            } else {
                throw new Error("Update failed");
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to update profile" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Account Dashboard</h1>
                    <p className="text-muted-foreground">Manage your settings and view your account activity.</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/account/security">Security Settings</Link>
                </Button>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/account/billing" className="block group">
                    <Card className="hover:border-primary transition-colors h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Billing & Plans
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Manage</div>
                            <p className="text-xs text-muted-foreground mt-1">Update your subscription and payment methods.</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/account/messages" className="block group">
                    <Card className="hover:border-primary transition-colors h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Message Center
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Inbox</div>
                            <p className="text-xs text-muted-foreground mt-1">Check your recent conversations with sellers.</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/account/orders" className="block group">
                    <Card className="hover:border-primary transition-colors h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" /> Order History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Activity</div>
                            <p className="text-xs text-muted-foreground mt-1">Track your purchases and transaction status.</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                <CardTitle>Profile Settings</CardTitle>
                            </div>
                            <CardDescription>Update your personal information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Input id="email" value={email} disabled className="bg-muted pl-10" />
                                    <div className="absolute left-3 top-2.5 text-muted-foreground">@</div>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Email cannot be changed for security reasons.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="focus-visible:ring-primary"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto">
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>

                    <ConnectedAccounts />
                </div>

                <div className="space-y-6">
                    <UsageSummary />
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Need Help?</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Check out our <Link href="/tutorial" className="text-primary hover:underline font-medium">Step-by-Step Tutorial</Link> to learn how to make the most of PickPic's AI features.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
