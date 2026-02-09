
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
import { Search, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function ListingsPage() {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchListings();
    }, [search]);

    async function fetchListings() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);

            const res = await fetch(`/api/super-admin/listings?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setListings(data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(productId: string, action: 'approve' | 'reject') {
        try {
            const res = await fetch('/api/super-admin/listings', {
                method: 'PATCH',
                body: JSON.stringify({ productId, action })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Success", description: `Listing ${action}d` });
                fetchListings();
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
                <h1 className="text-3xl font-bold tracking-tight">Listings</h1>
                <p className="text-muted-foreground">Moderate and manage product listings.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Products</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search title..."
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
                                    <TableHead>Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : listings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No listings found.</TableCell>
                                    </TableRow>
                                ) : (
                                    listings.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {item.image_url && (
                                                    <div className="relative h-10 w-10 overflow-hidden rounded">
                                                        <Image
                                                            src={item.image_url}
                                                            alt={item.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell>{item.business_name}</TableCell>
                                            <TableCell>{item.currency} {item.base_price}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.is_active ? "default" : "secondary"}>
                                                    {item.is_active ? 'Active' : 'Inactive'}
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
                                                        <DropdownMenuItem onClick={() => handleAction(item.id, 'approve')}>
                                                            Approve/Activate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction(item.id, 'reject')} className="text-destructive">
                                                            Reject/Deactivate
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
