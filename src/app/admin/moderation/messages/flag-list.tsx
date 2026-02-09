"use client";

import { useState } from "react";
import { updateFlagStatus, FlagStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Check, X, Eye } from "lucide-react";

interface FlagListProps {
    flags: any[];
    status: FlagStatus;
}

export function FlagList({ flags, status }: FlagListProps) {
    const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());

    const handleAction = async (id: string, action: FlagStatus) => {
        setSubmittingIds(prev => new Set(prev).add(id));
        await updateFlagStatus(id, action);
        setSubmittingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {flags.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            No reports in this queue.
                        </TableCell>
                    </TableRow>
                )}
                {flags.map((flag) => (
                    <TableRow key={flag.id}>
                        <TableCell className="font-medium capitalize">{flag.target_type}</TableCell>
                        <TableCell className="max-w-[300px] truncate" title={flag.reason}>{flag.reason}</TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="text-sm">{flag.reporter_name || 'Anonymous'}</span>
                                <span className="text-xs text-muted-foreground">{flag.reporter_email}</span>
                            </div>
                        </TableCell>
                        <TableCell>{format(new Date(flag.created_at), 'MMM d, p')}</TableCell>
                        <TableCell className="text-right">
                            {status === 'OPEN' && (
                                <div className="flex justify-end gap-2">
                                    {/* View Content (Mock) */}
                                    <Button size="sm" variant="ghost" title="View Content">
                                        <Eye className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 border-green-200"
                                        onClick={() => handleAction(flag.id, 'RESOLVED')}
                                        disabled={submittingIds.has(flag.id)}
                                        title="Resolve"
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-50"
                                        onClick={() => handleAction(flag.id, 'DISMISSED')}
                                        disabled={submittingIds.has(flag.id)}
                                        title="Dismiss"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
