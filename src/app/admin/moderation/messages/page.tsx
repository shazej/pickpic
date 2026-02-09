import { getFlags, FlagStatus } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlagList } from "./flag-list";

export default async function FlagsPage({ searchParams }: { searchParams: { tab?: string } }) {
    const activeTab = (await searchParams)?.tab || 'open';
    const flags = await getFlags(activeTab.toUpperCase() as FlagStatus);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Reported Content</h2>

            <Tabs defaultValue="open" className="w-full">
                <TabsList>
                    <a href="/admin/moderation/messages?tab=open"><TabsTrigger value="open" data-state={activeTab === 'open' ? 'active' : ''}>Open</TabsTrigger></a>
                    <a href="/admin/moderation/messages?tab=resolved"><TabsTrigger value="resolved" data-state={activeTab === 'resolved' ? 'active' : ''}>Resolved</TabsTrigger></a>
                    <a href="/admin/moderation/messages?tab=dismissed"><TabsTrigger value="dismissed" data-state={activeTab === 'dismissed' ? 'active' : ''}>Dismissed</TabsTrigger></a>
                </TabsList>

                <div className="mt-4">
                    <FlagList flags={flags} status={activeTab.toUpperCase() as FlagStatus} />
                </div>
            </Tabs>
        </div>
    );
}
