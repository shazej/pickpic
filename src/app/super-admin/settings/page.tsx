
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
    const [flags, setFlags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        setLoading(true);
        try {
            const res = await fetch(`/api/super-admin/settings`);
            const data = await res.json();
            if (data.success) {
                setFlags(data.data.featureFlags || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function toggleFlag(key_name: string, currentVal: boolean) {
        // Optimistic update
        const newVal = !currentVal;
        setFlags(flags.map(f => f.key_name === key_name ? { ...f, is_enabled: newVal } : f));

        try {
            const res = await fetch('/api/super-admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key_name, is_enabled: newVal })
            });
            const data = await res.json();
            if (!data.success) {
                // Revert
                setFlags(flags.map(f => f.key_name === key_name ? { ...f, is_enabled: currentVal } : f));
                toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
            } else {
                toast({ title: "Updated", description: `${key_name} is now ${newVal ? 'on' : 'off'}` });
            }
        } catch (e) {
            setFlags(flags.map(f => f.key_name === key_name ? { ...f, is_enabled: currentVal } : f));
            toast({ title: "Error", description: "Network error", variant: "destructive" });
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage global system configurations and feature flags.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Feature Flags</CardTitle>
                    <CardDescription>Toggle system-wide features on or off.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    {loading ? (
                        <div className="flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Loading...</div>
                    ) : flags.length === 0 ? (
                        <div>No feature flags configured.</div>
                    ) : (
                        flags.map((flag) => (
                            <div key={flag.key_name} className="flex items-center justify-between space-x-2">
                                <div className="flex flex-col space-y-1">
                                    <Label htmlFor={flag.key_name} className="font-medium">{flag.key_name.replace(/_/g, ' ').toUpperCase()}</Label>
                                    <span className="text-sm text-muted-foreground">{flag.description || 'No description'}</span>
                                </div>
                                <Switch
                                    id={flag.key_name}
                                    checked={flag.is_enabled}
                                    onCheckedChange={() => toggleFlag(flag.key_name, flag.is_enabled)}
                                />
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label className="font-medium text-destructive">Maintenance Mode</Label>
                            <span className="text-sm text-muted-foreground">Put the site in maintenance mode. Only admins can access.</span>
                        </div>
                        <Button variant="destructive" onClick={() => toggleFlag('maintenance_mode', false)}>Enable Maintenance</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
