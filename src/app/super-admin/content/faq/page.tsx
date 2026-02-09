
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FAQPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">FAQ Management</h1>
                <p className="text-muted-foreground">Manage frequently asked questions.</p>
            </div>
            <Card>
                <CardHeader><CardTitle>FAQ Items</CardTitle></CardHeader>
                <CardContent>
                    <p>FAQ management module coming soon.</p>
                </CardContent>
            </Card>
        </div>
    )
}
