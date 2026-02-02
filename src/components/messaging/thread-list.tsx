"use client";

import { Card, CardContent } from "@/components/ui/card";

export function ThreadList() {
    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4">
                    <p className="text-muted-foreground text-center">No messages yet.</p>
                </CardContent>
            </Card>
        </div>
    );
}
