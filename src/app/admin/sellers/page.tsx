import { getSellers, SellerStatus } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SellersTable } from "./sellers-table";

export default async function SellersPage({ searchParams }: { searchParams: { tab?: string } }) {
    // Current tab from URL or default to pending
    // Note: In Next.js server components, accessing searchParams is async in some versions, 
    // but in 15 it's awaited. The prompt implies standard usage.
    // For simplicity, we'll fetch all or just filter by tab.
    // Ideally we pass the data to the client component or fetch inside the tab content.
    // Let's fetch data for the active tab to save resources.

    // In strict Next.js 15, searchParams is clear.
    // However, to keep it simple and robust, let's just make the page a server component that passes data.

    const activeTab = (await searchParams)?.tab || 'pending';

    const pendingSellers = activeTab === 'pending' ? await getSellers('PENDING') : [];
    const approvedSellers = activeTab === 'approved' ? await getSellers('APPROVED') : [];
    const rejectedSellers = activeTab === 'rejected' ? await getSellers('REJECTED') : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Sellers</h2>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList>
                    <a href="/admin/sellers?tab=pending"><TabsTrigger value="pending" data-state={activeTab === 'pending' ? 'active' : ''}>Pending</TabsTrigger></a>
                    <a href="/admin/sellers?tab=approved"><TabsTrigger value="approved" data-state={activeTab === 'approved' ? 'active' : ''}>Approved</TabsTrigger></a>
                    <a href="/admin/sellers?tab=rejected"><TabsTrigger value="rejected" data-state={activeTab === 'rejected' ? 'active' : ''}>Rejected</TabsTrigger></a>
                </TabsList>

                <div className="mt-4">
                    {/* 
                       We render the table for the current tab. 
                       Using real links for tabs to persist state in URL (server-side friendly).
                       Visual tabs are just for UI.
                     */}

                    <Card>
                        <CardHeader>
                            <CardTitle className="capitalize">{activeTab} Sellers</CardTitle>
                            <CardDescription>
                                Manage {activeTab} seller applications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SellersTable
                                sellers={
                                    activeTab === 'pending' ? pendingSellers :
                                        activeTab === 'approved' ? approvedSellers :
                                            rejectedSellers
                                }
                                status={activeTab.toUpperCase() as SellerStatus}
                            />
                        </CardContent>
                    </Card>
                </div>
            </Tabs>
        </div>
    );
}
