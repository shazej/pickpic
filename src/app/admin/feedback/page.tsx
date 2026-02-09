'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function FeedbackPage() {
    // Mock data
    const feedback = [
        { id: 1, user: 'user1@example.com', sentiment: 'thumbs_up', comment: 'Great response!', topic: 'buyer-chat', created_at: '2023-10-05 10:00' },
        { id: 2, user: 'user2@example.com', sentiment: 'thumbs_down', comment: 'Hallucinated price', topic: 'seller-chat', created_at: '2023-10-05 11:30' },
    ];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">AI Feedback</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Feedback</CardTitle>
                    <CardDescription>User feedback on AI interactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Topic</TableHead>
                                <TableHead>Sentiment</TableHead>
                                <TableHead>Comment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {feedback.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.created_at}</TableCell>
                                    <TableCell>{item.user}</TableCell>
                                    <TableCell>{item.topic}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.sentiment === 'thumbs_up' ? 'default' : 'destructive'}>
                                            {item.sentiment}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.comment}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
