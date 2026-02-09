
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Store, ShoppingBag, CreditCard } from "lucide-react"
import { useEffect, useState } from "react"

export function OverviewStats() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/super-admin/stats');
                const data = await res.json();
                if (data.success) {
                    setStats(data.data);
                }
            } catch (e) {
                console.error("Failed to fetch stats", e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse h-32" />
            ))}
        </div>
    }

    if (!stats) return null;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.users?.total_users || 0}</div>
                    <p className="text-xs text-muted-foreground">
                        +{stats.users?.new_users_30d || 0} last 30 days
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.listings?.active_listings || 0}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.listings?.total_listings || 0} total created
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sellers</CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.sellers?.total_sellers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.sellers?.pending_sellers || 0} pending approval
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-muted-foreground">
                        +0% from last month
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
