"use client";

import { useEffect, useState } from "react";
import { Loader2, Settings2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch"; // Assuming shadcn
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
    const [flags, setFlags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchFlags = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.flags) {
                setFlags(data.flags);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to load settings" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlags();
    }, []);

    const toggleFlag = async (key: string, currentValue: boolean) => {
        const newValue = !currentValue;
        // Optimistic update
        setFlags(flags.map(f => f.key_name === key ? { ...f, is_enabled: newValue } : f));

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key_name: key, is_enabled: newValue })
            });
            if (res.ok) {
                toast({ title: "Settings updated" });
            } else {
                throw new Error("Failed");
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Update failed" });
            // Revert
            setFlags(flags.map(f => f.key_name === key ? { ...f, is_enabled: currentValue } : f));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2">
                <Settings2 className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            </div>

            <div className="rounded-md border bg-white shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Feature Flags</h2>
                {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                    <div className="space-y-6">
                        {flags.map((flag) => (
                            <div key={flag.key_name} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{flag.key_name.replace('_', ' ').toUpperCase()}</Label>
                                    <p className="text-sm text-gray-500">
                                        {flag.description || 'Controls system behavior.'}
                                    </p>
                                </div>
                                <Switch
                                    checked={flag.is_enabled}
                                    onCheckedChange={() => toggleFlag(flag.key_name, flag.is_enabled)}
                                />
                            </div>
                        ))}
                        {flags.length === 0 && <p>No feature flags configured.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
