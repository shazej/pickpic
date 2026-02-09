
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OverviewStats } from "@/components/admin/overview-stats"
import { Users, Store, ShoppingBag, Activity } from "lucide-react"

export default function Page() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of system performance and activity.</p>
            </div>

            <OverviewStats />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Activity log will appear here.
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Moderation Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Pending approval items.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
