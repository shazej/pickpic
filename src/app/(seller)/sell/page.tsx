
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Image as ImageIcon, DollarSign, Package, ShoppingCart, Eye } from "lucide-react";

export default function SellerDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your store performance.</p>
                </div>
                <Button asChild>
                    <Link href="/sell/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Listing
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$4,231.89</div>
                        <p className="text-xs text-green-500 font-medium">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12</div>
                        <p className="text-xs text-muted-foreground">+2 new today</p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sales</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+234</div>
                        <p className="text-xs text-green-500 font-medium">+19% from last month</p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">573</div>
                        <p className="text-xs text-blue-500 font-medium">+201 since last hour</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                    <CardTitle>Recent Listings</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {[
                            { id: 1, title: "Vintage Camera", price: "$185.00", status: "Active", views: 42, date: "2025-12-28" },
                            { id: 2, title: "Leather Jacket", price: "$120.00", status: "Sold", views: 156, date: "2025-12-25" },
                            { id: 3, title: "Coffee Maker", price: "$45.00", status: "Draft", views: 0, date: "2025-12-29" },
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">Added on {item.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden sm:block">
                                        <p className="font-medium">{item.price}</p>
                                        <p className="text-xs text-muted-foreground">{item.views} views</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Active' ? 'bg-green-100 text-green-700' :
                                            item.status === 'Sold' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                        {item.status}
                                    </div>
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
