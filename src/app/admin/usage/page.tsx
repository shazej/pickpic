'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function AdminUsagePage() {
    const usageData = [
        { name: 'Model A', tokens: 12000 },
        { name: 'Model B', tokens: 4900 },
        { name: 'Model C', tokens: 15000 },
    ];

    const topUsers = [
        { email: 'user1@example.com', tokens: 5000 },
        { email: 'user2@example.com', tokens: 4500 },
        { email: 'user3@example.com', tokens: 3000 },
    ];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Platform Usage Analytics</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Platform Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,234,567</div>
                        <p className="text-xs text-muted-foreground">+10% from last week</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Usage by Model</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={usageData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ color: '#000' }} />
                                <Bar dataKey="tokens" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Spenders</CardTitle>
                        <CardDescription>Users with highest token consumption.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {topUsers.map((user, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.email}</p>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        {user.tokens.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
