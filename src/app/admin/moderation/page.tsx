"use client";

import { useEffect, useState } from "react";
import {
    AlertCircle,
    Check,
    X,
    MessageSquare,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog" // Assuming shadcn dialog exists or fallback
import { Textarea } from "@/components/ui/textarea"

export default function ModerationPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [actionType, setActionType] = useState<'RESOLVED' | 'DISMISSED' | null>(null);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/moderation?status=PENDING');
            const data = await res.json();
            if (data.reports) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Failed to load reports" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleResolve = async () => {
        if (!selectedReport || !actionType) return;

        try {
            const res = await fetch('/api/admin/moderation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportId: selectedReport.id,
                    status: actionType,
                    resolutionNotes
                })
            });

            if (res.ok) {
                toast({ title: `Report ${actionType.toLowerCase()}` });
                setReports(reports.filter(r => r.id !== selectedReport.id));
                setSelectedReport(null);
                setResolutionNotes("");
                setActionType(null);
            } else {
                throw new Error('Action failed');
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Action failed" });
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Moderation Queue</h1>

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase">
                            <tr>
                                <th className="px-6 py-3">Reported Item</th>
                                <th className="px-6 py-3">Reason</th>
                                <th className="px-6 py-3">Reporter</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center pt-10 pb-10">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                    </td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No pending reports. Great job!
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium bg-gray-100 w-fit px-2 rounded text-xs mb-1">
                                                    {report.target_type}
                                                </span>
                                                <span className="font-mono text-xs text-gray-500">{report.target_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-red-600">{report.reason_category}</span>
                                                <span className="text-xs text-gray-500 line-clamp-2">{report.details}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {report.reporter_email || 'Anonymous'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedReport(report)}
                                                    >
                                                        Review
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Review Report #{report.id}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium text-sm text-gray-500">Details</h4>
                                                            <p className="text-sm bg-gray-50 p-3 rounded">{report.details}</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium text-sm text-gray-500">Resolution Notes</h4>
                                                            <Textarea
                                                                placeholder="Add optional notes..."
                                                                value={resolutionNotes}
                                                                onChange={(e) => setResolutionNotes(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 justify-end pt-4">
                                                            <Button
                                                                variant="outline"
                                                                className="text-gray-600"
                                                                onClick={() => {
                                                                    setActionType('DISMISSED');
                                                                    handleResolve();
                                                                }}
                                                            >
                                                                <X className="mr-2 h-4 w-4" />
                                                                Dismiss (Invalid)
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    setActionType('RESOLVED');
                                                                    handleResolve();
                                                                }}
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Resolve (Take Action)
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
