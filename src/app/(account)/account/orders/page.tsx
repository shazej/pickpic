import { getSession } from "@/lib/auth";
import { query, sql } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function OrdersPage() {
    const session = await getSession();
    if (!session || !session.user) {
        return <div>Please login to view orders.</div>;
    }

    const orders = await query(`
        SELECT id, total_amount, currency, status, payment_status, created_at 
        FROM marketplace.Orders 
        WHERE buyer_id = @userId 
        ORDER BY created_at DESC
    `, [{ name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">My Orders</h1>
            {orders.recordset.length === 0 ? (
                <p>No orders found.</p>
            ) : (
                <div className="space-y-4">
                    {orders.recordset.map((order: any) => (
                        <Card key={order.id}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-lg">Order #{order.id.slice(0, 8)}</p>
                                    <p className="text-sm text-muted-foreground">{format(order.created_at, 'MMM dd, yyyy')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">${order.total_amount.toFixed(2)}</p>
                                    <div className="space-x-2 mt-1">
                                        <Badge variant={order.status === 'pending' ? 'outline' : 'default'}>{order.status}</Badge>
                                        <Badge variant={order.payment_status === 'paid' ? 'secondary' : 'destructive'}>{order.payment_status}</Badge>
                                    </div>
                                </div>
                                <Button variant="ghost" asChild>
                                    <Link href={`/orders/${order.id}`}>View Details</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
