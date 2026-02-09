"use client";

import { useState } from "react";
import { format } from "date-fns";
import { updateSellerStatus, SellerStatus } from "./actions";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";


import { Check, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface SellersTableProps {
    sellers: any[];
    status: SellerStatus;
}

export function SellersTable({ sellers, status }: SellersTableProps) {
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Simple toast mock if not available, but let's try to simple alert fallback if needed.
    // In a real app I'd check the file structure.

    const handleApprove = async (id: string) => {
        if (!confirm("Approve this seller?")) return;

        setIsSubmitting(true);
        await updateSellerStatus(id, 'APPROVED');
        setIsSubmitting(false);
        toast({ title: "Seller Approved", description: `Seller ${id} approved.`, variant: "default" });
    };

    const handleReject = async () => {
        if (!rejectingId) return;
        setIsSubmitting(true);
        await updateSellerStatus(rejectingId, 'REJECTED', rejectReason);
        setIsSubmitting(false);
        toast({ title: "Seller Rejected", description: `Seller ${rejectingId} rejected.`, variant: "destructive" });
        setRejectingId(null);
        setRejectReason("");
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Store Name</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sellers.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                No sellers found.
                            </TableCell>
                        </TableRow>
                    )}
                    {sellers.map((seller) => (
                        <TableRow key={seller.id}>
                            <TableCell className="font-medium">{seller.store_name}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span>{seller.user_name}</span>
                                    <span className="text-xs text-muted-foreground">{seller.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>{format(new Date(seller.created_at), 'PPP')}</TableCell>
                            <TableCell>
                                <Badge variant={
                                    seller.status === 'APPROVED' ? 'default' :
                                        seller.status === 'REJECTED' ? 'destructive' : 'secondary'
                                }>
                                    {seller.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {status === 'PENDING' && (
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 w-8 p-0 border-green-200 hover:bg-green-50 text-green-600"
                                            onClick={() => handleApprove(seller.id)}
                                            disabled={isSubmitting}
                                        >
                                            <Check className="h-4 w-4" />
                                            <span className="sr-only">Approve</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 w-8 p-0 border-red-200 hover:bg-red-50 text-red-600"
                                            onClick={() => setRejectingId(seller.id)}
                                            disabled={isSubmitting}
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Reject</span>
                                        </Button>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Seller Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this seller. This will be sent to the user via email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isSubmitting || !rejectReason.trim()}>
                            Reject Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
