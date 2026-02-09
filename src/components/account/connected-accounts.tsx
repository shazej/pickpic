"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaGoogle, FaFacebook, FaApple, FaMicrosoft } from "react-icons/fa";
import { Loader2, Link2, Unlink } from "lucide-react";
import { signIn } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

interface ConnectedAccount {
    provider: string;
    created_at: string;
}

export function ConnectedAccounts() {
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [unlinking, setUnlinking] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchAccounts = async () => {
        try {
            const res = await fetch("/api/account/linked-accounts");
            const data = await res.json();
            if (data.accounts) {
                setAccounts(data.accounts);
            }
        } catch (error) {
            console.error("Failed to fetch accounts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleUnlink = async (provider: string) => {
        if (accounts.length <= 1) {
            toast({
                variant: "destructive",
                title: "Cannot unlink",
                description: "You must have at least one login method connected."
            });
            return;
        }

        setUnlinking(provider);
        try {
            const res = await fetch(`/api/account/unlink?provider=${provider}`, { method: "POST" });
            if (res.ok) {
                toast({ title: "Account unlinked successfully" });
                fetchAccounts();
            } else {
                throw new Error("Unlink failed");
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to unlink account" });
        } finally {
            setUnlinking(null);
        }
    };

    const providers = [
        { id: "google", name: "Google", icon: FaGoogle, color: "text-[#DB4437]" },
        { id: "facebook", name: "Facebook", icon: FaFacebook, color: "text-[#1877F2]" },
        { id: "microsoft-entra-id", name: "Microsoft", icon: FaMicrosoft, color: "text-[#00A4EF]" },
        { id: "apple", name: "Apple", icon: FaApple, color: "text-current" },
    ];

    if (loading) return (
        <Card>
            <CardContent className="p-6 flex justify-center">
                <Loader2 className="animate-spin" />
            </CardContent>
        </Card>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    Connected Accounts
                </CardTitle>
                <CardDescription>Manage your social login connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {providers.map((p) => {
                    const isConnected = accounts.some(a => a.provider === p.id);
                    const Icon = p.icon;

                    return (
                        <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Icon className={`${p.color} text-xl`} />
                                <div>
                                    <p className="font-medium">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {isConnected ? "Connected" : "Not connected"}
                                    </p>
                                </div>
                            </div>
                            {isConnected ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleUnlink(p.id)}
                                    disabled={unlinking === p.id}
                                >
                                    {unlinking === p.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Unlink className="h-4 w-4 mr-2" />}
                                    Disconnect
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => signIn(p.id)}
                                >
                                    Connect
                                </Button>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
