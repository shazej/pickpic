
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BillingPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
                <p className="text-muted-foreground">Manage plans and view revenue.</p>
            </div>
            <Card>
                <CardHeader><CardTitle>Subscription Overview</CardTitle></CardHeader>
                <CardContent>
                    <p>Billing integration pending payment provider setup.</p>
                </CardContent>
            </Card>
        </div>
    )
}
