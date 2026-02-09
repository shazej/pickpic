"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChatWindow({ threadId }: { threadId: string }) {
    return (
        <Card className="h-[500px] flex flex-col">
            <CardHeader>
                <CardTitle>Chat {threadId}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Select a conversation to start chatting.</p>
            </CardContent>
        </Card>
    );
}
