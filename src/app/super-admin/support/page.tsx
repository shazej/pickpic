
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SupportPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
                <p className="text-muted-foreground">View and respond to customer support requests.</p>
            </div>
            <Card>
                <CardHeader><CardTitle>Ticket Queue</CardTitle></CardHeader>
                <CardContent>
                    <p>Support ticket system integration pending.</p>
                </CardContent>
            </Card>
        </div>
    )
}
