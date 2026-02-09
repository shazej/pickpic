
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export function UsageSummary() {
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const res = await fetch('/api/user/usage');
                const data = await res.json();
                if (data.usage) {
                    setUsage(data.usage);
                }
            } catch (error) {
                console.error("Failed to fetch usage", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsage();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!usage) return null;

    // Hardcoded limits for demo/free plan logic
    const LIMITS = {
        listings: 5,
        aiScans: 50
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Usage Summary</CardTitle>
                <CardDescription>Your current cycle usage and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Active Listings</span>
                        <span className="font-medium">{usage.listings} / {LIMITS.listings}</span>
                    </div>
                    <Progress value={(usage.listings / LIMITS.listings) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">AI Product Scans</span>
                        <span className="font-medium">{usage.aiScans} / {LIMITS.aiScans}</span>
                    </div>
                    <Progress value={(usage.aiScans / LIMITS.aiScans) * 100} className="h-2" />
                </div>

                <p className="text-xs text-muted-foreground italic">
                    Usage resets at the end of your billing cycle.
                </p>
            </CardContent>
        </Card>
    );
}
