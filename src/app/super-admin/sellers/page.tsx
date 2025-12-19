
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Loader2, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

export default function SellersPage() {
    const [sellers, setSellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchSellers();
    }, [search]); // Add debounce in real app

    async function fetchSellers() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);

            const res = await fetch(`/api/super-admin/sellers?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setSellers(data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(sellerId: string, action: 'approve' | 'suspend') {
        try {
            const res = await fetch('/api/super-admin/sellers', {
                method: 'PATCH',
                body: JSON.stringify({ sellerId, action })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Success", description: `Seller ${action}d successfully` });
                fetchSellers();
            } else {
                toast({ title: "Error", description: data.error, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to perform action", variant: "destructive" });
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Sellers</h1>
                <p className="text-muted-foreground">Manage seller accounts and verification.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Seller List</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search business..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business</TableHead>
                                    <TableHead>User Email</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : sellers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">No sellers found.</TableCell>
                                    </TableRow>
                                ) : (
                                    sellers.map((seller) => (
                                        <TableRow key={seller.user_id}>
                                            <TableCell>
                                                <div className="font-medium">{seller.business_name}</div>
                                            </TableCell>
                                            <TableCell>{seller.email}</TableCell>
                                            <TableCell>{seller.rating}</TableCell>
                                            <TableCell>
                                                <Badge variant={seller.is_approved ? "default" : "warning"}>
                                                    {seller.is_approved ? 'Approved' : 'Pending'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleAction(seller.user_id, 'approve')}>
                                                            Approve Seller
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction(seller.user_id, 'suspend')} className="text-destructive">
                                                            Suspend Seller
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
