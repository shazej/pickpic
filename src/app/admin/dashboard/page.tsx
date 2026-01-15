"use client";

import { useEffect, useState } from "react";
import {
    Users,
    ShoppingBag,
    AlertTriangle,
    TrendingUp,
    Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming UI components exist or inline fallback

// Simple Card components if global ones aren't available/compatible
function StatCard({ title, value, icon: Icon, description, color }: any) {
    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-gray-500">{title}</h3>
                <Icon className={`h-4 w-4 text-${color}-500`} />
            </div>
            <div className="pt-2">
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/metrics')
            .then(res => res.json())
            .then(data => {
                if (data.stats) {
                    setStats(data.stats);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="p-8">Loading stats...</div>;
    }

    if (!stats) {
        return <div className="p-8 text-red-500">Failed to load statistics.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="blue"
                    description="Registered accounts"
                />
                <StatCard
                    title="Pending Sellers"
                    value={stats.pendingSellers || 0}
                    icon={Users} // Reuse Users or Store icon if imported
                    color="orange"
                    description="Awaiting approval"
                />
                <StatCard
                    title="Active Listings"
                    value={stats.activeListings}
                    icon={ShoppingBag}
                    color="green"
                    description="Products available for sale"
                />
                <StatCard
                    title="Pending Reports"
                    value={stats.pendingReports}
                    icon={AlertTriangle}
                    color="yellow"
                    description="Requires moderation"
                />
                <StatCard
                    title="Items Sold"
                    value={stats.itemsSold}
                    icon={TrendingUp}
                    color="purple"
                    description="Total successfully sold"
                />
            </div>

            {/* Quick Activity Section placeholder */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h2>
                <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-gray-500">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No recent system alerts or audit logs to display.</p>
                </div>
            </div>
        </div>
    );
}
