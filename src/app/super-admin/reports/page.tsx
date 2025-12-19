
"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [resolutionNote, setResolutionNote] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchReports();
    }, [statusFilter]);

    async function fetchReports() {
        setLoading(true);
        try {
            const res = await fetch(`/api/super-admin/reports?status=${statusFilter}`);
            const data = await res.json();
            if (data.success) {
                setReports(data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleResolve(status: 'RESOLVED' | 'DISMISSED') {
        if (!selectedReport) return;
        try {
            const res = await fetch('/api/super-admin/reports', {
                method: 'PATCH',
                body: JSON.stringify({
                    reportId: selectedReport.id,
                    status,
                    resolutionNotes: resolutionNote
                })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Success", description: `Report ${status.toLowerCase()}` });
                setSelectedReport(null);
                setResolutionNote("");
                fetchReports();
            } else {
                toast({ title: "Error", description: data.error, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to resolve report", variant: "destructive" });
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                <p className="text-muted-foreground">Handle user reports and abuse.</p>
            </div>

            <Tabs defaultValue="PENDING" onValueChange={setStatusFilter}>
                <TabsList>
                    <TabsTrigger value="PENDING">Pending</TabsTrigger>
                    <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
                    <TabsTrigger value="DISMISSED">Dismissed</TabsTrigger>
                </TabsList>

                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Reports Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Reporter</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                        </TableRow>
                                    ) : reports.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">No reports found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        reports.map((report) => (
                                            <TableRow key={report.id}>
                                                <TableCell><Badge variant="outline">{report.target_type}</Badge></TableCell>
                                                <TableCell className="font-medium">{report.reason_category}</TableCell>
                                                <TableCell>{report.reporter_email}</TableCell>
                                                <TableCell className="max-w-[300px] truncate">{report.details}</TableCell>
                                                <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    {report.status === 'PENDING' && (
                                                        <Button size="sm" onClick={() => setSelectedReport(report)}>Review</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </Tabs>

            <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Review Report #{selectedReport?.id}</DialogTitle>
                        <DialogDescription>
                            Review the details and decide on an action.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="font-bold">Target:</span>
                            <span className="col-span-3">{selectedReport?.target_type} ID: {selectedReport?.target_id}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="font-bold">Reason:</span>
                            <span className="col-span-3">{selectedReport?.reason_category}</span>
                        </div>
                        <div className="grid gap-2">
                            <span className="font-bold">Details:</span>
                            <p className="text-sm bg-muted p-2 rounded">{selectedReport?.details}</p>
                        </div>
                        <div className="grid gap-2">
                            <span className="font-bold">Resolution Notes:</span>
                            <Textarea
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="Internal note..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleResolve('DISMISSED')}>Dismiss</Button>
                        <Button onClick={() => handleResolve('RESOLVED')}>Resolve & Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
