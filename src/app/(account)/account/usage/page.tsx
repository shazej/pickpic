'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function UsagePage() {
    // Mock data for now, ideally fetch from API
    // const [usage, setUsage] = useState([]);
    const usageData = [
        { date: '2023-10-01', tokens: 1200 },
        { date: '2023-10-02', tokens: 900 },
        { date: '2023-10-03', tokens: 1500 },
        { date: '2023-10-04', tokens: 400 },
        { date: '2023-10-05', tokens: 2000 },
    ];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Token Usage</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tokens Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-normal">6,000</div>
                        <p className="text-xs text-muted-foreground">+20% from last month</p>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Remaining Credits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-normal">94,000</div>
                        <p className="text-xs text-muted-foreground">Plan: Professional (100k limit)</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                <Card className="col-span-4 border border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-medium">Usage History</CardTitle>
                        <CardDescription>Daily token consumption over the last 30 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={usageData}>
                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ color: '#000' }} />
                                <Bar dataKey="tokens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
