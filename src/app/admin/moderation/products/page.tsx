import { getModerationQueue, ModerationStatus } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductModerationList } from "./product-list";

export default async function ProductModerationPage({ searchParams }: { searchParams: { tab?: string } }) {
    const activeTab = (await searchParams)?.tab || 'pending';
    const products = await getModerationQueue(activeTab.toUpperCase() as ModerationStatus);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Product Moderation</h2>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList>
                    <a href="/admin/moderation/products?tab=pending"><TabsTrigger value="pending" data-state={activeTab === 'pending' ? 'active' : ''}>Pending</TabsTrigger></a>
                    <a href="/admin/moderation/products?tab=flagged"><TabsTrigger value="flagged" data-state={activeTab === 'flagged' ? 'active' : ''}>Flagged</TabsTrigger></a>
                    <a href="/admin/moderation/products?tab=rejected"><TabsTrigger value="rejected" data-state={activeTab === 'rejected' ? 'active' : ''}>Rejected</TabsTrigger></a>
                </TabsList>

                <div className="mt-4">
                    <ProductModerationList products={products} status={activeTab.toUpperCase() as ModerationStatus} />
                </div>
            </Tabs>
        </div>
    );
}
